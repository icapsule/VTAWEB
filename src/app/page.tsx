import { db } from '@/server/db';
import { rankings } from '@/server/db/schema';
import { asc } from 'drizzle-orm';
import { tournaments, recentMatches } from '@/lib/mock-data';
import { formatDateRange, getSurfaceClass, getStatusBadgeClass } from '@/lib/utils';
import { RankingsContainer } from '@/components/features/RankingsContainer';

export const metadata = {
  title: 'VTAWEB — Live Tennis Dashboard',
  description: 'Real-time ATP and WTA tennis rankings, upcoming tournaments, and recent match results.',
};

export const revalidate = 604800; // 1 week

export default async function HomePage() {
  const liveTournaments = tournaments.filter((t) => t.status === 'live');
  const upcomingTournaments = tournaments.filter((t) => t.status === 'upcoming').slice(0, 4);
  
  // Fetch from Real DB
  const allRankings = await db.select().from(rankings).orderBy(asc(rankings.rank));
  
  const atpStandard = allRankings.filter(r => r.tour === 'atp' && r.type === 'standard');
  const atpRace = allRankings.filter(r => r.tour === 'atp' && r.type === 'race');
  const wtaStandard = allRankings.filter(r => r.tour === 'wta' && r.type === 'standard');
  const wtaRace = allRankings.filter(r => r.tour === 'wta' && r.type === 'race');

  // Top 10 for dashboard
  const topATP = atpStandard.slice(0, 10);
  const topWTA = wtaStandard.slice(0, 10);

  return (
    <div className="page-content">
      {/* ---- Hero Section ---- */}
      <section className="hero" id="hero-section">
        <div className="container">
          <p className="hero__eyebrow">Automated Tennis Intelligence</p>
          <h1 className="hero__title">Live Rankings &<br />Tournament Tracker</h1>
          <p className="hero__subtitle">
            ATP & WTA rankings, tournament schedules, and match results — automatically
            synced daily from open data sources. Zero manual updates.
          </p>
        </div>
      </section>

      {/* ---- Stats Overview ---- */}
      <section className="section" id="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card animate-in">
              <span className="stat-card__label">ATP #1</span>
              <span className="stat-card__value">{topATP[0]?.name.split(' ').pop() || 'N/A'}</span>
              <span className="stat-card__sub">{topATP[0]?.points.toLocaleString() || 0} pts</span>
            </div>
            <div className="stat-card animate-in" style={{ animationDelay: '0.1s' }}>
              <span className="stat-card__label">WTA #1</span>
              <span className="stat-card__value">{topWTA[0]?.name.split(' ').pop() || 'N/A'}</span>
              <span className="stat-card__sub">{topWTA[0]?.points.toLocaleString() || 0} pts</span>
            </div>
            <div className="stat-card animate-in" style={{ animationDelay: '0.2s' }}>
              <span className="stat-card__label">Live Tournaments</span>
              <span className="stat-card__value">{liveTournaments.length}</span>
              <span className="stat-card__sub">In progress now</span>
            </div>
            <div className="stat-card animate-in" style={{ animationDelay: '0.3s' }}>
              <span className="stat-card__label">Upcoming</span>
              <span className="stat-card__value">{upcomingTournaments.length}</span>
              <span className="stat-card__sub">Next 30 days</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Top 10 Rankings (Combined) ---- */}
      <section className="section" id="combined-rankings-section">
        <div className="container">
          <RankingsContainer 
            atpData={{ standard: topATP, race: atpRace.slice(0, 10) }}
            wtaData={{ standard: topWTA, race: wtaRace.slice(0, 10) }}
          />
          <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
            <a href="/rankings" className="view-all-link" id="view-all-rankings">View Full Rankings →</a>
          </div>
        </div>
      </section>

      {/* ---- Live & Upcoming Tournaments ---- */}
      <section className="section" id="tournaments-section">
        <div className="container">
          <h2 className="section-title">Tournaments</h2>
          <div className="tournament-grid">
            {[...liveTournaments, ...upcomingTournaments].map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
          <div style={{ marginTop: 'var(--space-lg)', textAlign: 'right' }}>
            <a href="/tournaments" className="view-all-link" id="tournaments-view-all">View All Tournaments →</a>
          </div>
        </div>
      </section>

      {/* ---- Recent Results ---- */}
      <section className="section" id="recent-results-section">
        <div className="container">
          <h2 className="section-title">Recent Results</h2>
          <MatchResultsTable matches={recentMatches} />
        </div>
      </section>

      <style>{`
        .view-all-link {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--color-accent);
          transition: opacity var(--transition-fast);
        }
        .view-all-link:hover { opacity: 0.7; }
        .change--up { color: var(--color-accent); font-size: 0.8rem; }
        .change--down { color: var(--color-accent-red); font-size: 0.8rem; }
        .change--stable { color: var(--color-text-muted); font-size: 0.8rem; }
      `}</style>
    </div>
  );
}


/* ---- Tournament Card Component ---- */
function TournamentCard({ tournament }: { tournament: any }) {
  const t = tournament;
  return (
    <div className="tournament-card" id={`tournament-${t.id}`}>
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

/* ---- Match Results Table Component ---- */
function MatchResultsTable({ matches }: { matches: any[] }) {
  return (
    <div className="data-table-wrapper">
      <table className="data-table" id="recent-matches-table">
        <thead>
          <tr>
            <th>Tournament</th>
            <th>Round</th>
            <th>Players</th>
            <th>Score</th>
            <th style={{ width: '100px' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => (
            <tr key={m.id}>
              <td style={{ fontWeight: 500 }}>{m.tournamentName}</td>
              <td><span className="badge badge--upcoming">{m.round}</span></td>
              <td>
                <span style={{ fontWeight: m.winner === m.player1 ? 700 : 400 }}>
                  {m.player1}
                </span>
                {' vs '}
                <span style={{ fontWeight: m.winner === m.player2 ? 700 : 400 }}>
                  {m.player2}
                </span>
              </td>
              <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{m.score}</td>
              <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
