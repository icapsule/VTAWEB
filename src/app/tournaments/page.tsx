import { db } from '@/server/db';
import { tournaments } from '@/server/db/schema';
import { asc } from 'drizzle-orm';
import { TournamentToggleContainer } from '@/components/features/TournamentToggleContainer';

export const metadata = {
  title: 'Tennis Tournaments — Schedule & Calendar | VTAWEB',
  description: 'Complete ATP and WTA tournament calendar with dates, surfaces, and status. Automatically updated.',
};

export default async function TournamentsPage() {
  const allTournaments = await db.select().from(tournaments).orderBy(asc(tournaments.startDate));

  return (
    <div className="page-content">
      <div className="container">
        <h1 className="section-title" style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
          Tournament Calendar
        </h1>

        <TournamentToggleContainer allTournaments={allTournaments} />

        <div className="updated-stamp" style={{ marginTop: 'var(--space-xl)', justifyContent: 'center' }}>
          Tournament data is updated daily from open tennis databases
        </div>
      </div>
    </div>
  );
}
