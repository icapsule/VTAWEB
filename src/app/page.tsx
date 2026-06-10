import { db } from '@/server/db';
import { rankings, tournaments } from '@/server/db/schema';
import { asc } from 'drizzle-orm';
import { recentMatches } from '@/lib/mock-data';
import { formatDateRange, getSurfaceClass, getStatusBadgeClass } from '@/lib/utils';
import { RankingsContainer } from '@/components/features/RankingsContainer';

export const metadata = {
  title: 'VTAWEB — Live Tennis Dashboard',
  description: 'Real-time ATP and WTA tennis rankings, upcoming tournaments, and recent match results.',
};

export const revalidate = 604800; // 1 week

export default async function HomePage() {
  const allTournaments = await db.select().from(tournaments).orderBy(asc(tournaments.startDate));
  const liveTournaments = allTournaments.filter((t) => t.status === 'live');
  const upcomingTournaments = allTournaments.filter((t) => t.status === 'upcoming').slice(0, 4);
  
  const grandSlams = allTournaments.filter(t => t.category === 'Grand Slam');
  const uniqueGrandSlams: any[] = [];
  const seenGsNames = new Set();
  for (const t of grandSlams) {
    if (!seenGsNames.has(t.name)) {
      seenGsNames.add(t.name);
      uniqueGrandSlams.push(t);
    }
  }

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

      {/* ---- Grand Slams Dashboard ---- */}
      <section className="section" id="tournaments-section">
        <div className="container">
          <h2 className="section-title">The Grand Slams</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-md)',
          }}>
            {uniqueGrandSlams.map((t: any) => (
              <GrandSlamCard key={t.id} tournament={t} />
            ))}
          </div>
          <div style={{ marginTop: 'var(--space-lg)', textAlign: 'right' }}>
            <a href="/tournaments" className="view-all-link" id="tournaments-view-all">View Tournament Calendar →</a>
          </div>
        </div>
      </section>

      {/* ---- Live Scores & Results ---- */}
      <section className="section" id="recent-results-section">
        <div className="container">
          <h2 className="section-title">Live Scores & Results</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-md)',
            marginTop: 'var(--space-md)'
          }}>
            <a 
              href="https://www.atptour.com/en/scores/current/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="stat-card animate-in"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', padding: 'var(--space-xl)' }}
            >
              <span style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>🎾</span>
              <span className="stat-card__label" style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>ATP Tour Live Scores</span>
              <span className="stat-card__sub" style={{ marginTop: 'var(--space-xs)' }}>View real-time point-by-point updates on official site ↗</span>
            </a>
            <a 
              href="https://www.wtatennis.com/scores" 
              target="_blank" 
              rel="noopener noreferrer"
              className="stat-card animate-in"
              style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', padding: 'var(--space-xl)' }}
            >
              <span style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>🔥</span>
              <span className="stat-card__label" style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>WTA Tour Live Scores</span>
              <span className="stat-card__sub" style={{ marginTop: 'var(--space-xs)' }}>View latest women's tennis scores and results ↗</span>
            </a>
          </div>
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
        
        .gs-card {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);
        }
        .gs-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        }
        .gs-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 6px;
          background: var(--gs-color, var(--color-accent));
        }
        .gs-card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-md);
        }
        .gs-card__name {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text);
        }
        .gs-card__logo {
          font-size: 2rem;
          line-height: 1;
        }
        .gs-card__info {
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          margin-bottom: var(--space-md);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .gs-card__champions {
          margin-top: auto;
          padding-top: var(--space-md);
          border-top: 1px solid var(--color-border);
          font-size: 0.85rem;
        }
        .gs-card__champ-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .gs-card__champ-label {
          color: var(--color-text-muted);
        }
        .gs-card__champ-name {
          font-weight: 600;
          color: var(--color-text);
        }
      `}</style>
    </div>
  );
}

/* ---- Grand Slam Card Component ---- */
function GrandSlamCard({ tournament }: { tournament: any }) {
  const t = tournament;
  const nameLower = t.name.toLowerCase();
  
  // Hardcoded Theme and Champions
  let logo = '🎾';
  let color = 'var(--color-accent)';
  let menChamp = 'TBD';
  let womenChamp = 'TBD';

  if (nameLower.includes('australian')) {
    logo = '🦘';
    color = '#005BBB'; // AO Blue
    menChamp = 'Jannik Sinner';
    womenChamp = 'Aryna Sabalenka';
  } else if (nameLower.includes('roland') || nameLower.includes('french')) {
    logo = '🗼';
    color = '#CB5A36'; // Roland Garros Clay
    menChamp = 'Carlos Alcaraz';
    womenChamp = 'Iga Świątek';
  } else if (nameLower.includes('wimbledon')) {
    logo = '🍓';
    color = '#006B3F'; // Wimbledon Green
    menChamp = 'Carlos Alcaraz';
    womenChamp = 'Barbora Krejčíková';
  } else if (nameLower.includes('us open')) {
    logo = '🗽';
    color = '#002868'; // US Open Blue
    menChamp = 'Jannik Sinner';
    womenChamp = 'Aryna Sabalenka';
  }

  const isCompleted = t.status === 'completed';
  const champLabel = isCompleted ? `${t.startDate.getFullYear()} Champ:` : 'Defending Champ:';

  return (
    <div className="gs-card animate-in" style={{ '--gs-color': color } as React.CSSProperties}>
      <div className="gs-card__header">
        <div className="gs-card__name">{t.name}</div>
        <div className="gs-card__logo">{logo}</div>
      </div>
      <div className="gs-card__info">
        <div>📍 {t.city}, {t.country === 'UNK' ? t.city : t.country}</div>
        <div>📅 {formatDateRange(t.startDate, t.endDate)}</div>
      </div>
      <div className="gs-card__champions">
        <div className="gs-card__champ-row">
          <span className="gs-card__champ-label">Men's {champLabel}</span>
          <span className="gs-card__champ-name">{menChamp}</span>
        </div>
        <div className="gs-card__champ-row">
          <span className="gs-card__champ-label">Women's {champLabel}</span>
          <span className="gs-card__champ-name">{womenChamp}</span>
        </div>
      </div>
    </div>
  );
}
