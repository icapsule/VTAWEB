import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db';
import { rankings } from '@/server/db/schema';

async function fetchRapidApiRankings(tour: 'atp' | 'wta', top_n = 100) {
  const url = `https://tennis-api-atp-wta-itf.p.rapidapi.com/tennis/v2/${tour}/ranking/singles`;
  const resp = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
      'X-RapidAPI-Host': 'tennis-api-atp-wta-itf.p.rapidapi.com'
    },
    cache: 'no-store'
  });
  
  if (!resp.ok) {
    console.error(`RapidAPI fetch failed: ${resp.status}`);
    return [];
  }
  
  const rawData = await resp.json();
  const dataList = Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData) ? rawData : []);
  
  const results = [];
  for (const item of dataList.slice(0, top_n)) {
    const rank = parseInt(item.ranking || item.rank || '0', 10);
    
    let change = parseInt(String(item.movement), 10);
    if (isNaN(change)) change = 0;
    
    results.push({
      tour,
      type: 'standard' as const,
      rank,
      name: item.name || item.player || `Unknown #${rank}`,
      country: item.country || 'UNK',
      points: parseInt(item.points || '0', 10),
      change
    });
  }
  return results;
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

    if (!process.env.RAPIDAPI_KEY) {
      console.warn('⚠️ RAPIDAPI_KEY is missing in environment variables!');
    }

    console.log('🔄 Cron Triggered: Fetching real ranking data from RapidAPI and Wikipedia...');

    // 1. Fetch RapidAPI for Rankings and Wiki for Race (Current + Historical)
    const [atpStandard, wtaStandard, realAtpRace, realWtaRace, histAtpRace, histWtaRace] = await Promise.all([
      fetchRapidApiRankings('atp', 100),
      fetchRapidApiRankings('wta', 100),
      fetchWikiRaceRankings('atp', false),
      fetchWikiRaceRankings('wta', false),
      fetchWikiRaceRankings('atp', true),
      fetchWikiRaceRankings('wta', true)
    ]);

    // Build Name Maps to inject countries into Race rankings
    const nameToCountryMap = new Map();
    [...atpStandard, ...wtaStandard].forEach(r => {
      nameToCountryMap.set(r.name.toLowerCase().trim(), r.country);
    });

    // Build previous rankings maps to calculate deltas (Race)
    const atpPrevRaceMap = new Map();
    histAtpRace.forEach(r => atpPrevRaceMap.set(r.name, r.rank));

    const wtaPrevRaceMap = new Map();
    histWtaRace.forEach(r => wtaPrevRaceMap.set(r.name, r.rank));

    // Construct DB payload
    const insertData = [
      ...atpStandard,
      ...wtaStandard,
      ...realAtpRace.map((r: any) => {
        const previousRank = atpPrevRaceMap.get(r.name);
        const change = previousRank ? previousRank - r.rank : 0;
        return {
          ...r,
          change,
          country: nameToCountryMap.get(r.name.toLowerCase().trim()) || r.country
        };
      }),
      ...realWtaRace.map((r: any) => {
        const previousRank = wtaPrevRaceMap.get(r.name);
        const change = previousRank ? previousRank - r.rank : 0;
        return {
          ...r,
          change,
          country: nameToCountryMap.get(r.name.toLowerCase().trim()) || r.country
        };
      })
    ];

    if (insertData.length === 0) {
      return NextResponse.json({ error: 'Failed to fetch any data. Check API keys and external services.' }, { status: 500 });
    }

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
