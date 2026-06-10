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

async function fetchWikiRaceRankings(tour: 'atp' | 'wta') {
  const year = new Date().getUTCFullYear();
  const pageName = tour === 'atp' ? `${year}_ATP_Finals` : `${year}_WTA_Finals`;
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageName}&prop=wikitext&format=json`;

  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'VTAWEB_Bot/1.0' } });
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

        results.push({
          tour,
          type: 'race' as const,
          rank,
          name,
          country: 'UNK', 
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

    // 1. Fetch CSVs for Rankings and Wiki for Race
    const [atpRankings, atpPlayers, wtaRankings, wtaPlayers, realAtpRace, realWtaRace] = await Promise.all([
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_rankings_current.csv'),
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_players.csv'),
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_wta/master/wta_rankings_current.csv'),
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_wta/master/wta_players.csv'),
      fetchWikiRaceRankings('atp'),
      fetchWikiRaceRankings('wta')
    ]);

    // Build Player Maps
    const atpPlayerMap = new Map();
    atpPlayers.forEach(p => atpPlayerMap.set(p.player_id, p));

    const wtaPlayerMap = new Map();
    wtaPlayers.forEach(p => wtaPlayerMap.set(p.player_id, p));

    // Find latest dates and previous dates
    const atpDates = [...new Set(atpRankings.map(r => r.ranking_date))].filter(Boolean).sort((a, b) => b.localeCompare(a));
    const atpMaxDate = atpDates[0] || '0';
    const atpPrevDate = atpDates[1] || '0';

    const wtaDates = [...new Set(wtaRankings.map(r => r.ranking_date))].filter(Boolean).sort((a, b) => b.localeCompare(a));
    const wtaMaxDate = wtaDates[0] || '0';
    const wtaPrevDate = wtaDates[1] || '0';

    // Build previous rankings maps to calculate deltas
    const atpPrevMap = new Map();
    atpRankings.filter(r => r.ranking_date === atpPrevDate).forEach(r => atpPrevMap.set(r.player, parseInt(r.rank)));

    const wtaPrevMap = new Map();
    wtaRankings.filter(r => r.ranking_date === wtaPrevDate).forEach(r => wtaPrevMap.set(r.player, parseInt(r.rank)));

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
      ...realAtpRace,
      ...realWtaRace
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

