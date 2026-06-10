import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db';
import { rankings } from '@/server/db/schema';
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

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Cron Triggered: Fetching real data from Jeff Sackmann...');

    // 1. Fetch CSVs
    const [atpRankings, atpPlayers, wtaRankings, wtaPlayers] = await Promise.all([
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_rankings_current.csv'),
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_players.csv'),
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_wta/master/wta_rankings_current.csv'),
      fetchAndParseCsv('https://raw.githubusercontent.com/JeffSackmann/tennis_wta/master/wta_players.csv')
    ]);

    // 2. Build Player Maps
    const atpPlayerMap = new Map();
    atpPlayers.forEach(p => atpPlayerMap.set(p.player_id, p));

    const wtaPlayerMap = new Map();
    wtaPlayers.forEach(p => wtaPlayerMap.set(p.player_id, p));

    // 3. Find latest dates and previous dates
    const atpDates = [...new Set(atpRankings.map(r => r.ranking_date))].filter(Boolean).sort((a, b) => b.localeCompare(a));
    const atpMaxDate = atpDates[0] || '0';
    const atpPrevDate = atpDates[1] || '0';

    const wtaDates = [...new Set(wtaRankings.map(r => r.ranking_date))].filter(Boolean).sort((a, b) => b.localeCompare(a));
    const wtaMaxDate = wtaDates[0] || '0';
    const wtaPrevDate = wtaDates[1] || '0';

    // 4. Build previous rankings maps to calculate deltas
    const atpPrevMap = new Map();
    atpRankings.filter(r => r.ranking_date === atpPrevDate).forEach(r => atpPrevMap.set(r.player, parseInt(r.rank)));

    const wtaPrevMap = new Map();
    wtaRankings.filter(r => r.ranking_date === wtaPrevDate).forEach(r => wtaPrevMap.set(r.player, parseInt(r.rank)));

    // 5. Filter current Top 100
    const atpCurrent = atpRankings.filter(r => r.ranking_date === atpMaxDate && parseInt(r.rank) <= 100);
    const wtaCurrent = wtaRankings.filter(r => r.ranking_date === wtaMaxDate && parseInt(r.rank) <= 100);

    // 6. Construct DB payload (Real Standard + Mock Race)
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
      // Option A: Restore the mock data for Race to Turin/WTA Finals
      ...atpRaceRankings.map(p => ({ tour: 'atp' as const, type: 'race' as const, rank: p.rank, name: p.name, country: p.country, points: p.points, change: p.change })),
      ...wtaRaceRankings.map(p => ({ tour: 'wta' as const, type: 'race' as const, rank: p.rank, name: p.name, country: p.country, points: p.points, change: p.change }))
    ];

    console.log(`Prepared ${insertData.length} ranking rows. Inserting to DB...`);

    // 6. DB Transaction: Delete old and insert new
    await db.delete(rankings);
    await db.insert(rankings).values(insertData);

    console.log('✅ Real Rankings (and Mock Race) data synced to DB successfully.');

    // 7. Revalidate Cache
    revalidatePath('/');
    revalidatePath('/rankings');

    return NextResponse.json({ success: true, message: `Real Data synced (${insertData.length} records) and cache revalidated.` });

  } catch (error) {
    console.error('❌ Error syncing data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
