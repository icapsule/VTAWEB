import { db } from '@/server/db';
import { tournaments } from '@/server/db/schema';
import { asc } from 'drizzle-orm';
import { formatDateRange, getSurfaceClass, getStatusBadgeClass } from '@/lib/utils';

export const metadata = {
  title: 'Tennis Tournaments — Schedule & Calendar | VTAWEB',
  description: 'Complete ATP and WTA tournament calendar with dates, surfaces, and status. Automatically updated.',
};

export default async function TournamentsPage() {
  const allTournaments = await db.select().from(tournaments).orderBy(asc(tournaments.startDate));
  const liveTournaments = allTournaments.filter((t) => t.status === 'live');
  const upcomingTournaments = allTournaments.filter((t) => t.status === 'upcoming');
  const completedTournaments = allTournaments.filter((t) => t.status === 'completed');

  return (
    <div className="page-content">
      <div className="container">
        <h1 className="section-title" style={{ marginTop: 'var(--space-xl)' }}>
          Tournament Calendar
        </h1>

        {/* Live Tournaments */}
        {liveTournaments.length > 0 && (
          <section id="live-tournaments" style={{ marginBottom: 'var(--space-3xl)' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              fontWeight: 700,
              marginBottom: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
            }}>
              <span className="badge badge--live">● LIVE</span>
              In Progress
            </h2>
            <div className="tournament-grid">
              {liveTournaments.map((t) => (
                <TournamentDetailCard key={t.id} tournament={t} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Tournaments */}
        {upcomingTournaments.length > 0 && (
          <section id="upcoming-tournaments" style={{ marginBottom: 'var(--space-3xl)' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              fontWeight: 700,
              marginBottom: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
            }}>
              <span className="badge badge--upcoming">Upcoming</span>
              Coming Soon
            </h2>
            <div className="tournament-grid">
              {upcomingTournaments.map((t) => (
                <TournamentDetailCard key={t.id} tournament={t} />
              ))}
            </div>
          </section>
        )}

        {/* Completed Tournaments */}
        {completedTournaments.length > 0 && (
          <section id="completed-tournaments">
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              fontWeight: 700,
              marginBottom: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
            }}>
              <span className="badge badge--completed">Completed</span>
              Recent Events
            </h2>
            <div className="tournament-grid">
              {completedTournaments.map((t) => (
                <TournamentDetailCard key={t.id} tournament={t} />
              ))}
            </div>
          </section>
        )}

        <div className="updated-stamp" style={{ marginTop: 'var(--space-xl)', justifyContent: 'center' }}>
          Tournament data is updated daily from open tennis databases
        </div>
      </div>
    </div>
  );
}

function TournamentDetailCard({ tournament }: { tournament: any }) {
  const t = tournament;
  return (
    <div className="tournament-card" id={`tournament-detail-${t.id}`}>
      <div className="tournament-card__header">
        <div>
          <div className="tournament-card__name">{t.name}</div>
          <div className="tournament-card__location">📍 {t.city}, {t.country}</div>
        </div>
        <span className={`badge ${getStatusBadgeClass(t.status)}`}>
          {t.status === 'live' ? '● LIVE' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
        </span>
      </div>
      <div className="tournament-card__meta">
        <span className={`tournament-card__surface ${getSurfaceClass(t.surface)}`}>
          {t.surface}
        </span>
        <span className={`badge ${t.tour === 'atp' ? 'badge--atp' : 'badge--wta'}`}>
          {t.tour.toUpperCase()}
        </span>
        <span className="badge" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-secondary)' }}>
          {t.category}
        </span>
      </div>
      <div className="tournament-card__dates">
        📅 {formatDateRange(t.startDate, t.endDate)}
      </div>
    </div>
  );
}
