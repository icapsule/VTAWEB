import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db';
import { rankings, tournaments } from '@/server/db/schema';
import Papa from 'papaparse';

async function fetchAndParseCsv(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  const csvText = await response.text();
  return new Promise<any[]>((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error: any) => reject(error),
    });
  });
}

async function fetchWikiRaceRankings(tour: 'atp' | 'wta', isHistorical: boolean = false) {
  const year = new Date().getUTCFullYear();
  const pageName = tour === 'atp' ? `${year}_ATP_Finals` : `${year}_WTA_Finals`;
  let targetUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageName}&prop=wikitext&format=json`;

  try {
    if (isHistorical) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const revUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles=${pageName}&rvstart=${sevenDaysAgo}&rvdir=older&rvlimit=1&format=json`;
      const revRes = await fetch(revUrl, { headers: { 'User-Agent': 'VTAWEB_Bot/1.0' } });
      const revData = await revRes.json();
      const pages = revData?.query?.pages;
      const pageId = pages ? Object.keys(pages)[0] : null;
      const oldid = pageId && pages[pageId]?.revisions ? pages[pageId].revisions[0]?.revid : null;
      
      if (!oldid) return []; // No historical revision found
      targetUrl = `https://en.wikipedia.org/w/api.php?action=parse&oldid=${oldid}&prop=wikitext&format=json`;
    }

    const response = await fetch(targetUrl, { headers: { 'User-Agent': 'VTAWEB_Bot/1.0' } });
    if (!response.ok) return [];
    const data = await response.json();
    const wikitext = data?.parse?.wikitext?.['*'] || '';

    const tableMatch = wikitext.match(/===\s*Singles\s*===.*?\{\|class="wikitable.*?\n(.*?)\n\|\}/s);
    if (!tableMatch) return [];

    const singlesText = tableMatch[1];
    const rowsRaw = singlesText.split('|-');
    const results = [];

    for (const row of rowsRaw) {
      if (!/align="?left"?/.test(row)) continue;

      const rankMatch = row.match(/\|\s*(\d+)/);
      const nameMatch = row.match(/\[\[(.*?)\]\]/);
      const pointsMatch = row.match(/\!\s*([\d,]+)/);

      if (rankMatch && nameMatch && pointsMatch) {
        const rank = parseInt(rankMatch[1], 10);
        const nameRaw = nameMatch[1];
        const name = nameRaw.includes('|') ? nameRaw.split('|')[0] : nameRaw;
        const points = parseInt(pointsMatch[1].replace(/,/g, ''), 10);

        const countryMatch = row.match(/\{\{flagicon\|(.*?)\}\}/i) || row.match(/\{\{flagu\|(.*?)\}\}/i);
        const wikiCountry = countryMatch ? countryMatch[1].substring(0, 3).toUpperCase() : 'UNK';

        results.push({
          tour,
          type: 'race' as const,
          rank,
          name,
          country: wikiCountry, 
          points,
          change: 0
        });
      }
    }
    return results;
  } catch (error) {
    console.error(`Failed to fetch ${tour} race from wiki:`, error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Cron Triggered: Fetching real ranking data from Jeff Sackmann...');

    // 1. Fetch CSVs for Rankings and Wiki for Race (Current + Historical)
    const [atpRankings, atpPlayers, wtaRankings, wtaPlayers, realAtpRace, realWtaRace, histAtpRace, histWtaRace] = await Promise.all([
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_rankings_current.csv'),
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_players.csv'),
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_wta/master/wta_rankings_current.csv'),
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_wta/master/wta_players.csv'),
      fetchWikiRaceRankings('atp', false),
      fetchWikiRaceRankings('wta', false),
      fetchWikiRaceRankings('atp', true),
      fetchWikiRaceRankings('wta', true)
    ]);

    // Build Player Maps
    const atpPlayerMap = new Map();
    const atpNameMap = new Map();
    atpPlayers.forEach(p => {
      atpPlayerMap.set(p.player_id, p);
      atpNameMap.set(`${p.name_first} ${p.name_last}`.trim().toLowerCase(), p.ioc);
    });

    const wtaPlayerMap = new Map();
    const wtaNameMap = new Map();
    wtaPlayers.forEach(p => {
      wtaPlayerMap.set(p.player_id, p);
      wtaNameMap.set(`${p.name_first} ${p.name_last}`.trim().toLowerCase(), p.ioc);
    });

    // Find latest dates and previous dates
    const atpDates = [...new Set(atpRankings.map(r => r.ranking_date))].filter(Boolean).sort((a, b) => b.localeCompare(a));
    const atpMaxDate = atpDates[0] || '0';
    const atpPrevDate = atpDates[1] || '0';

    const wtaDates = [...new Set(wtaRankings.map(r => r.ranking_date))].filter(Boolean).sort((a, b) => b.localeCompare(a));
    const wtaMaxDate = wtaDates[0] || '0';
    const wtaPrevDate = wtaDates[1] || '0';

    // Build previous rankings maps to calculate deltas (Standard)
    const atpPrevMap = new Map();
    atpRankings.filter(r => r.ranking_date === atpPrevDate).forEach(r => atpPrevMap.set(r.player, parseInt(r.rank)));

    const wtaPrevMap = new Map();
    wtaRankings.filter(r => r.ranking_date === wtaPrevDate).forEach(r => wtaPrevMap.set(r.player, parseInt(r.rank)));

    // Build previous rankings maps to calculate deltas (Race)
    const atpPrevRaceMap = new Map();
    histAtpRace.forEach(r => atpPrevRaceMap.set(r.name, r.rank));

    const wtaPrevRaceMap = new Map();
    histWtaRace.forEach(r => wtaPrevRaceMap.set(r.name, r.rank));

    // Filter current Top 100
    const atpCurrent = atpRankings.filter(r => r.ranking_date === atpMaxDate && parseInt(r.rank) <= 100);
    const wtaCurrent = wtaRankings.filter(r => r.ranking_date === wtaMaxDate && parseInt(r.rank) <= 100);

    // Construct DB payload (Real Standard + Mock Race)
    const insertData = [
      ...atpCurrent.map(r => {
        const p = atpPlayerMap.get(r.player);
        const currentRank = parseInt(r.rank);
        const previousRank = atpPrevMap.get(r.player);
        const change = previousRank ? previousRank - currentRank : 0;
        return {
          tour: 'atp' as const,
          type: 'standard' as const,
          rank: currentRank,
          name: p ? `${p.name_first} ${p.name_last}`.trim() : 'Unknown Player',
          country: p ? p.ioc : 'UNK',
          points: parseInt(r.points),
          change: change
        };
      }),
      ...wtaCurrent.map(r => {
        const p = wtaPlayerMap.get(r.player);
        const currentRank = parseInt(r.rank);
        const previousRank = wtaPrevMap.get(r.player);
        const change = previousRank ? previousRank - currentRank : 0;
        return {
          tour: 'wta' as const,
          type: 'standard' as const,
          rank: currentRank,
          name: p ? `${p.name_first} ${p.name_last}`.trim() : 'Unknown Player',
          country: p ? p.ioc : 'UNK',
          points: parseInt(r.points),
          change: change
        };
      }),
      ...realAtpRace.map((r: any) => {
        const previousRank = atpPrevRaceMap.get(r.name);
        const change = previousRank ? previousRank - r.rank : 0;
        return {
          ...r,
          change,
          country: atpNameMap.get(r.name.toLowerCase()) || r.country
        };
      }),
      ...realWtaRace.map((r: any) => {
        const previousRank = wtaPrevRaceMap.get(r.name);
        const change = previousRank ? previousRank - r.rank : 0;
        return {
          ...r,
          change,
          country: wtaNameMap.get(r.name.toLowerCase()) || r.country
        };
      })
    ];

    console.log(`Prepared ${insertData.length} ranking rows. Inserting to DB...`);

    // DB Transaction: Delete old and insert new
    await db.delete(rankings);
    await db.insert(rankings).values(insertData);

    console.log('✅ Real Rankings synced to DB successfully.');

    // Revalidate Cache
    revalidatePath('/');
    revalidatePath('/rankings');
    revalidatePath('/tournaments');

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${insertData.length} ranking records.` 
    });

  } catch (error) {
    console.error('❌ Error syncing data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

