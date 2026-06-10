import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db';
import { rankings } from '@/server/db/schema';
import { atpRankings, wtaRankings, atpRaceRankings, wtaRaceRankings } from '@/lib/mock-data';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Cron Triggered: Syncing rankings data...');

    // In a real implementation, we would fetch(API_URL, { headers: { 'X-RapidAPI-Key': ... } })
    // For now, we seed/sync using our local structured mock data to prove the DB ingestion pipeline.
    
    // Clear old rankings
    await db.delete(rankings);
    
    const insertData = [
      ...atpRankings.map(p => ({ tour: 'atp' as const, type: 'standard' as const, rank: p.rank, name: p.name, country: p.country, points: p.points, change: p.change })),
      ...wtaRankings.map(p => ({ tour: 'wta' as const, type: 'standard' as const, rank: p.rank, name: p.name, country: p.country, points: p.points, change: p.change })),
      ...atpRaceRankings.map(p => ({ tour: 'atp' as const, type: 'race' as const, rank: p.rank, name: p.name, country: p.country, points: p.points, change: p.change })),
      ...wtaRaceRankings.map(p => ({ tour: 'wta' as const, type: 'race' as const, rank: p.rank, name: p.name, country: p.country, points: p.points, change: p.change })),
    ];

    await db.insert(rankings).values(insertData);

    console.log('✅ Rankings data synced to DB successfully.');

    // Revalidate the Next.js static cache
    revalidatePath('/');
    revalidatePath('/rankings');

    return NextResponse.json({ success: true, message: 'Data synced and cache revalidated.' });

  } catch (error) {
    console.error('❌ Error syncing data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
