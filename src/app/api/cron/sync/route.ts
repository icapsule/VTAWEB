import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db';
import { rankings, grandSlamChampions, bigTitlesLeaderboard } from '@/server/db/schema';

export const maxDuration = 60; // 60 seconds timeout limit on Vercel

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
    const rank = parseInt(item.position || item.ranking || item.rank || '0', 10);
    
    let change = parseInt(String(item.movement), 10);
    if (isNaN(change)) change = 0;
    
    const playerName = item.player?.name || item.name || `Unknown #${rank}`;
    const country = item.player?.countryAcr || item.country || 'UNK';
    const points = parseInt(item.point || item.rankingPoints || item.points || '0', 10);
    
    results.push({
      tour,
      type: 'standard' as const,
      rank,
      name: playerName,
      country: country,
      points: points,
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

async function fetchWikiGrandSlamChampions() {
  const slams = [
    { id: 'australian-open', page: 'List_of_Australian_Open_men%27s_singles_champions', tour: 'atp' as const },
    { id: 'french-open', page: 'List_of_French_Open_men%27s_singles_champions', tour: 'atp' as const },
    { id: 'wimbledon', page: 'List_of_Wimbledon_gentlemen%27s_singles_champions', tour: 'atp' as const },
    { id: 'us-open', page: 'List_of_US_Open_men%27s_singles_champions', tour: 'atp' as const },
    { id: 'australian-open', page: 'List_of_Australian_Open_women%27s_singles_champions', tour: 'wta' as const },
    { id: 'french-open', page: 'List_of_French_Open_women%27s_singles_champions', tour: 'wta' as const },
    { id: 'wimbledon', page: 'List_of_Wimbledon_ladies%27_singles_champions', tour: 'wta' as const },
    { id: 'us-open', page: 'List_of_US_Open_women%27s_singles_champions', tour: 'wta' as const },
  ];

  const allRecords: any[] = [];
  const currentYear = new Date().getUTCFullYear();

  for (const s of slams) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${s.page}&prop=wikitext&format=json`;
      const res = await fetch(url, { headers: { 'User-Agent': 'VTAWEB_Bot/1.0' } });
      if (!res.ok) continue;
      const data = await res.json();
      const wikitext = data?.parse?.wikitext?.['*'] || '';

      // Extract rows from Open Era tables
      const rows = wikitext.split('|-');
      for (const row of rows) {
        // Match year digits (1968 - 2030)
        const yearMatch = row.match(/(?:\||\!)\s*(19[6-9]\d|20[0-3]\d)\b/);
        if (!yearMatch) continue;

        const year = parseInt(yearMatch[1], 10);
        if (year < 1968 || year > currentYear + 1) continue;

        // Extract names from {{sortname|First|Last}} or [[Full Name]]
        const names: string[] = [];

        // 1. Sortname macro {{sortname|First|Last}}
        const sortnameMatches = Array.from(row.matchAll(/\{\{sortname\|(.*?)\|(.*?)\}\}/gi)) as RegExpExecArray[];
        sortnameMatches.forEach(m => {
          names.push(`${m[1]} ${m[2]}`.trim());
        });

        // 2. Bracketed links [[Player Name]]
        if (names.length < 2) {
          const matches = Array.from(row.matchAll(/\[\[(.*?)\]\]/g)) as RegExpExecArray[];
          matches.forEach(m => {
            const link = m[1].split('|')[0].trim();
            if (!link.includes(':') && !link.toLowerCase().includes('open') && !link.toLowerCase().includes('championships') && !link.toLowerCase().includes('final')) {
              if (!names.includes(link)) {
                names.push(link);
              }
            }
          });
        }

        if (names.length >= 2) {
          const champion = names[0];
          const runnerUp = names[1];
          
          const flagMatches = Array.from(row.matchAll(/\{\{flag(?:icon|u)?\|(.*?)\}\}/gi)) as RegExpExecArray[];
          const flags = flagMatches.map(m => m[1].substring(0, 3).toUpperCase());
          const champCountry = flags[0] || 'UNK';
          const runnerCountry = flags[1] || 'UNK';

          const scoreMatch = row.match(/\|\s*(\d[\d\s\-\(\)\,\;\,\.]+\d)/);
          const score = scoreMatch ? scoreMatch[1].trim() : 'N/A';

          allRecords.push({
            slamId: s.id,
            tour: s.tour,
            year,
            champion,
            champCountry,
            runnerUp,
            runnerCountry,
            score
          });
        }
      }

    } catch (err) {
      console.error(`Error fetching Grand Slam ${s.id} (${s.tour}):`, err);
    }
  }
  return allRecords;
}

async function fetchWikiBigTitlesLeaderboard() {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=Big_Titles_ATP_stats&prop=wikitext&format=json`;
  const fallbackUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=List_of_ATP_Tour_big_titles_singles_champions&prop=wikitext&format=json`;

  try {
    let res = await fetch(url, { headers: { 'User-Agent': 'VTAWEB_Bot/1.0' } });
    if (!res.ok) {
      res = await fetch(fallbackUrl, { headers: { 'User-Agent': 'VTAWEB_Bot/1.0' } });
    }
    if (!res.ok) return [];
    
    const data = await res.json();
    const wikitext = data?.parse?.wikitext?.['*'] || '';

    const rows = wikitext.split('|-');
    const records: any[] = [];

    for (const row of rows) {
      const nameMatch = row.match(/\[\[(.*?)\]\]/);
      if (!nameMatch) continue;

      const rawName = nameMatch[1].split('|')[0].trim();
      if (rawName.includes(':') || rawName.toLowerCase().includes('list') || rawName.toLowerCase().includes('atp')) continue;

      const flagMatch = row.match(/\{\{flag(?:icon|u)?\|(.*?)\}\}/i);
      const country = flagMatch ? flagMatch[1].substring(0, 3).toUpperCase() : 'UNK';

      // Parse numbers in the row
      const numMatches = Array.from(row.matchAll(/\|\s*(\d+)\s*/g)) as RegExpExecArray[];
      const numbers = numMatches.map(m => parseInt(m[1], 10));

      if (numbers.length >= 5) {
        records.push({
          playerName: rawName,
          country,
          grandSlams: numbers[0] || 0,
          atpFinals: numbers[1] || 0,
          masters1000: numbers[2] || 0,
          olympics: numbers[3] || 0,
          totalBigTitles: numbers[4] || 0,
        });
      }
    }
    return records;
  } catch (err) {
    console.error('Error fetching Big Titles Leaderboard:', err);
    return [];
  }
}


export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- Supabase Anti-Pause Keep-Alive Ping ---
    try {
      const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supaUrl && supaKey) {
        await fetch(`${supaUrl}/rest/v1/rankings?limit=1`, {
          headers: { 
            'apikey': supaKey, 
            'Authorization': `Bearer ${supaKey}` 
          }
        });
        console.log('✅ Sent Supabase REST API keep-alive ping.');
      } else {
        console.warn('⚠️ Skipping Supabase keep-alive: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.');
      }
    } catch (pingErr) {
      console.error('⚠️ Failed to send Supabase keep-alive ping:', pingErr);
    }

    if (!process.env.RAPIDAPI_KEY) {
      console.warn('⚠️ RAPIDAPI_KEY is missing in environment variables!');
    }

    console.log('🔄 Cron Triggered: Fetching real ranking & slam data from RapidAPI & Wikipedia...');

    // 1. Fetch Rankings
    const atpStandard = await fetchRapidApiRankings('atp', 100);
    await new Promise(res => setTimeout(res, 1500)); // 1.5s delay
    const wtaStandard = await fetchRapidApiRankings('wta', 100);

    const [realAtpRace, realWtaRace] = await Promise.all([
      fetchWikiRaceRankings('atp', false),
      fetchWikiRaceRankings('wta', false),
    ]);

    const nameToCountryMap = new Map();
    [...atpStandard, ...wtaStandard].forEach(r => {
      nameToCountryMap.set(r.name.toLowerCase().trim(), r.country);
    });

    const existingRankings = await db.select().from(rankings);
    const oldRankMap = new Map();
    existingRankings.forEach(r => {
      oldRankMap.set(`${r.tour}-${r.type}-${r.name.toLowerCase().trim()}`, r);
    });

    const computeChange = (tour: 'atp' | 'wta', type: 'standard' | 'race', name: string, newRank: number) => {
      const old = oldRankMap.get(`${tour}-${type}-${name.toLowerCase().trim()}`);
      if (!old) return 0;
      const diffDays = (Date.now() - new Date(old.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 4) return old.change;
      return old.rank - newRank;
    };

    const insertRankingsData = [
      ...atpStandard.map(r => ({ ...r, change: computeChange('atp', 'standard', r.name, r.rank) })),
      ...wtaStandard.map(r => ({ ...r, change: computeChange('wta', 'standard', r.name, r.rank) })),
      ...realAtpRace.map((r: any) => ({
        ...r,
        change: computeChange('atp', 'race', r.name, r.rank),
        country: nameToCountryMap.get(r.name.toLowerCase().trim()) || r.country
      })),
      ...realWtaRace.map((r: any) => ({
        ...r,
        change: computeChange('wta', 'race', r.name, r.rank),
        country: nameToCountryMap.get(r.name.toLowerCase().trim()) || r.country
      }))
    ];

    if (insertRankingsData.length === 0) {
      console.warn('⚠️ RapidAPI returned 0 rankings data (likely key or quota issue). Proceeding with Wiki sync...');
    } else {
      try {
        await db.delete(rankings);
        await db.insert(rankings).values(insertRankingsData);
        console.log(`✅ Synced ${insertRankingsData.length} rankings to DB.`);
      } catch (e) {
        console.error('⚠️ Failed to sync rankings:', e);
      }
    }


    // 2. Fetch Grand Slams & Big Titles Leaderboard
    const [slamChamps, bigTitles] = await Promise.all([
      fetchWikiGrandSlamChampions(),
      fetchWikiBigTitlesLeaderboard()
    ]);

    if (slamChamps.length > 0) {
      try {
        await db.delete(grandSlamChampions);
        await db.insert(grandSlamChampions).values(slamChamps);
        console.log(`✅ Synced ${slamChamps.length} Grand Slam champions to DB.`);
      } catch (e) {
        console.error('⚠️ Failed to sync grand slam champions:', e);
      }
    }

    if (bigTitles.length > 0) {
      try {
        await db.delete(bigTitlesLeaderboard);
        await db.insert(bigTitlesLeaderboard).values(bigTitles);
        console.log(`✅ Synced ${bigTitles.length} Big Titles leaderboard records to DB.`);
      } catch (e) {
        console.error('⚠️ Failed to sync big titles leaderboard:', e);
      }
    }

    // Revalidate Cache
    revalidatePath('/');
    revalidatePath('/rankings');
    revalidatePath('/tournaments');

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${insertRankingsData.length} rankings, ${slamChamps.length} slam champions, ${bigTitles.length} big titles.` 
    });

  } catch (error: any) {
    console.error('❌ Error syncing data:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error?.message || error) }, { status: 500 });
  }
}


