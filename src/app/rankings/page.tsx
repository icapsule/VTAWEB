import { db } from '@/server/db';
import { rankings } from '@/server/db/schema';
import { asc } from 'drizzle-orm';
import { RankingsContainer } from '@/components/features/RankingsContainer';

export const metadata = {
  title: 'Tennis Rankings — ATP & WTA | VTAWEB',
  description: 'Complete ATP and WTA tennis rankings with points, country, and weekly changes.',
};

// Revalidate the page cache weekly or let the API route revalidate it.
export const revalidate = 604800; // 1 week

export default async function RankingsPage() {
  // Fetch all rankings from PostgreSQL
  const allRankings = await db.select().from(rankings).orderBy(asc(rankings.rank));
  
  const atpStandard = allRankings.filter(r => r.tour === 'atp' && r.type === 'standard');
  const atpRace = allRankings.filter(r => r.tour === 'atp' && r.type === 'race');
  const wtaStandard = allRankings.filter(r => r.tour === 'wta' && r.type === 'standard');
  const wtaRace = allRankings.filter(r => r.tour === 'wta' && r.type === 'race');

  return (
    <div className="page-content">
      <div className="container">
        <h1 className="section-title" style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
          Tennis Rankings
        </h1>

        <RankingsContainer 
          atpData={{ standard: atpStandard, race: atpRace }}
          wtaData={{ standard: wtaStandard, race: wtaRace }}
        />

        <div className="updated-stamp" style={{ marginTop: 'var(--space-xl)', justifyContent: 'center' }}>
          Rankings are updated dynamically from real database
        </div>
      </div>

      <style>{`
        .change--up { color: var(--color-accent); font-size: 0.8rem; }
        .change--down { color: var(--color-accent-red); font-size: 0.8rem; }
        .change--stable { color: var(--color-text-muted); font-size: 0.8rem; }
      `}</style>
    </div>
  );
}
