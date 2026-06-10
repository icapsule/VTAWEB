import { db } from '@/server/db';
import { tournaments } from '@/server/db/schema';
import { asc } from 'drizzle-orm';
import { TournamentToggleContainer } from '@/components/features/TournamentToggleContainer';

export const metadata = {
  title: 'Tennis Tournaments — Schedule & Calendar | VTAWEB',
  description: 'Complete ATP and WTA tournament calendar with dates, surfaces, and status. Automatically updated.',
};

export default async function TournamentsPage() {
  // Read static tournaments data
  const staticTournaments = require('@/lib/data/tournaments.json');
  
  // Process them to determine status
  const processedTournaments = staticTournaments.map((t: any) => {
      const start = new Date(`${t.startDate}T00:00:00`);
      const end = new Date(`${t.endDate}T23:59:59`);
      const now = new Date();
      let status = 'upcoming';
      if (now > end) status = 'completed';
      else if (now >= start && now <= end) status = 'live';
      
      return {
        ...t,
        startDate: start,
        endDate: end,
        status
      };
  });
  
  // Sort by start date ascending
  processedTournaments.sort((a: any, b: any) => a.startDate.getTime() - b.startDate.getTime());

  return (
    <div className="page-content">
      <div className="container">
        <h1 className="section-title" style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
          Tournament Calendar
        </h1>

        <TournamentToggleContainer allTournaments={processedTournaments} />

        <div className="updated-stamp" style={{ marginTop: 'var(--space-xl)', justifyContent: 'center' }}>
          Tournament schedule is curated and fixed
        </div>
      </div>
    </div>
  );
}
