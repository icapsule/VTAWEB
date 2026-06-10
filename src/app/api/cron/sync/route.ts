import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db';
import { rankings, tournaments } from '@/server/db/schema';
import Papa from 'papaparse';
import { atpRaceRankings, wtaRaceRankings } from '@/lib/mock-data';

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

async function syncTournamentsWiki(tour: 'atp' | 'wta') {
  const year = new Date().getFullYear();
  const pageName = `${year}_${tour.toUpperCase()}_Tour`;
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageName}&prop=wikitext&format=json`;
  
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  if (!json.parse || !json.parse.wikitext) return [];
  const wikitext = json.parse.wikitext['*'] as string;
  
  const lines = wikitext.split('\n');
  const results: any[] = [];
  
  let currentDates = "";
  let insideTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('{| class="wikitable"')) insideTable = true;
    if (line.startsWith('|}')) insideTable = false;
    
    if (!insideTable) continue;

    if (line.startsWith('!') && (line.includes('Jan') || line.includes('Feb') || line.includes('Mar') || line.includes('Apr') || line.includes('May') || line.includes('Jun') || line.includes('Jul') || line.includes('Aug') || line.includes('Sep') || line.includes('Oct') || line.includes('Nov') || line.includes('Dec'))) {
       const match = line.match(/\d{1,2} [A-Z][a-z]{2}/g);
       if (match && line.startsWith('!')) {
           currentDates = match.join(' - ');
       }
    }
    
    if (line.includes('Grand Slam') || line.includes('ATP Masters 1000') || line.includes('WTA 1000') || line.includes('ATP Finals') || line.includes('WTA Finals')) {
       
       let name = "Unknown Tournament";
       const links = [...line.matchAll(/\[\[([^\]]+)\]\]/g)];
       if (links.length > 0) {
           const parts = links[0][1].split('|');
           name = parts.length > 1 ? parts[1] : parts[0];
           if (name === 'Grand Slam' && links.length > 1) {
              const parts2 = links[1][1].split('|');
              name = parts2.length > 1 ? parts2[1] : parts2[0];
           }
       }
       
       let category = line.includes('Grand Slam') ? 'Grand Slam' : 
                      line.includes('Finals') ? 'Finals' : 
                      tour === 'atp' ? 'Masters 1000' : 'WTA 1000';
                      
       let surface = line.includes('Hard') ? 'Hard' : line.includes('Clay') ? 'Clay' : line.includes('Grass') ? 'Grass' : 'Hard';
       
       let city = "Unknown";
       if (links.length > 1) {
           const parts = links[1][1].split('|');
           city = parts.length > 1 ? parts[1] : parts[0];
           if (city === 'Grand Slam' || city === 'ATP Masters 1000' || city === 'WTA 1000') {
               city = "Unknown";
           }
       }
       
       let startDateStr = currentDates.split('-')[0]?.trim();
       let endDateStr = currentDates.split('-').pop()?.trim() || startDateStr;
       
       let startDate = new Date(`${startDateStr} ${year}`);
       let endDate = new Date(`${endDateStr} ${year}`);
       
       if (isNaN(startDate.getTime())) startDate = new Date();
       if (isNaN(endDate.getTime())) endDate = new Date();

       let status = 'upcoming';
       const now = new Date();
       if (now > endDate) status = 'completed';
       else if (now >= startDate && now <= endDate) status = 'live';

       if (name && !name.includes('Grand Slam') && !name.includes('ATP Masters') && !name.includes('WTA 1000') && !results.find(r => r.name === name)) {
           results.push({
             name, city, country: 'UNK', surface, status, tour, category, startDate, endDate
           });
       }
    }
  }
  return results;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Cron Triggered: Fetching real data from Jeff Sackmann and Wikipedia...');

    // 1. Fetch CSVs for Rankings
    const [atpRankings, atpPlayers, wtaRankings, wtaPlayers] = await Promise.all([
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_rankings_current.csv'),
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_players.csv'),
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_wta/master/wta_rankings_current.csv'),
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_wta/master/wta_players.csv')
    ]);

    // 2. Fetch Tournaments from Wikipedia
    const [atpTournaments, wtaTournaments] = await Promise.all([
      syncTournamentsWiki('atp'),
      syncTournamentsWiki('wta')
    ]);
    const allTournaments = [...atpTournaments, ...wtaTournaments];

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
      ...atpRaceRankings.map(p => ({ tour: 'atp' as const, type: 'race' as const, rank: p.rank, name: p.name, country: p.country, points: p.points, change: p.change })),
      ...wtaRaceRankings.map(p => ({ tour: 'wta' as const, type: 'race' as const, rank: p.rank, name: p.name, country: p.country, points: p.points, change: p.change }))
    ];

    console.log(`Prepared ${insertData.length} ranking rows and ${allTournaments.length} tournament rows. Inserting to DB...`);

    // DB Transaction: Delete old and insert new
    await db.delete(rankings);
    await db.insert(rankings).values(insertData);

    if (allTournaments.length > 0) {
      await db.delete(tournaments);
      await db.insert(tournaments).values(allTournaments);
    }

    console.log('✅ Real Rankings and Wikipedia Tournaments synced to DB successfully.');

    // Revalidate Cache
    revalidatePath('/');
    revalidatePath('/rankings');

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${insertData.length} ranking records and ${allTournaments.length} tournaments.` 
    });

  } catch (error) {
    console.error('❌ Error syncing data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

