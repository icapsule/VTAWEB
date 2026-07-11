import React from 'react';
import Link from 'next/link';
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
  // Read static tournaments data
  const staticTournaments = require('@/lib/data/tournaments.json');
  
  // Get Grand Slams and process them
  const uniqueGrandSlams = staticTournaments
    .filter((t: any) => t.category === 'Grand Slam' && t.startDate.startsWith('2026'))
    .map((t: any) => {
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

  // Calculate live/upcoming stats from static data
  const processedStatic = staticTournaments.map((t: any) => {
      const start = new Date(`${t.startDate}T00:00:00`);
      const end = new Date(`${t.endDate}T23:59:59`);
      const now = new Date();
      let status = 'upcoming';
      if (now > end) status = 'completed';
      else if (now >= start && now <= end) status = 'live';
      return { status };
  });
  
  const liveTournaments = processedStatic.filter((t: any) => t.status === 'live');
  const upcomingTournaments = processedStatic.filter((t: any) => t.status === 'upcoming');

  // Fetch from Real DB
  let allRankings: any[] = [];
  try {
    allRankings = await db.select().from(rankings).orderBy(asc(rankings.rank));
  } catch (error) {
    console.error("⚠️ Failed to fetch rankings from database:", error);
    // 抛出错误以防止 Next.js ISR 缓存空白页面 (Supabase休眠时)
    throw new Error("Failed to fetch rankings from database. Is Supabase paused?");
  }
  
  const atpStandard = allRankings.filter(r => r.tour === 'atp' && r.type === 'standard');
  const atpRace = allRankings.filter(r => r.tour === 'atp' && r.type === 'race');
  const wtaStandard = allRankings.filter(r => r.tour === 'wta' && r.type === 'standard');
  const wtaRace = allRankings.filter(r => r.tour === 'wta' && r.type === 'race');

  // Top 10 for dashboard
  const topATP = atpStandard.slice(0, 10);
  const topWTA = wtaStandard.slice(0, 10);

  return (
    <div className="page-content home-page-content">
      {/* ---- Hero Section (Cinematic Full-Bleed) ---- */}
      <section className="hero" id="hero-section" style={{ position: 'relative', overflow: 'hidden', minHeight: '88vh', display: 'flex', alignItems: 'center' }}>
        
        {/* Cinematic Background Video Layer */}
        <div className="hero-video-wrapper">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="hero-video"
          >
            <source src="/videos/big3-highlights.mp4" type="video/mp4" />
          </video>
          {/* Dark Gradient Overlay to ensure text readability */}
          <div className="hero-video-overlay"></div>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 10, width: '100%' }}>
          <p className="hero__eyebrow">Automated Tennis Intelligence</p>
          <h1 className="hero__title">Live Rankings &<br />Tournament Tracker</h1>
          <p className="hero__subtitle" style={{ maxWidth: '600px' }}>
            ATP & WTA rankings, tournament schedules, and match results — automatically
            synced daily from open data sources. Zero manual updates.
          </p>
        </div>
      </section>

      {/* ---- Big Titles Leaderboard ---- */}
      <section className="section" id="big-titles-section">
        <div className="container">
          <h2 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>Official Big Titles Leaderboard</h2>
          <div className="table-container animate-in">
            <table className="big-titles-table">
              <thead>
                <tr>
                  <th>Tournament Category</th>
                  <th>🇷🇸 Novak Djokovic</th>
                  <th>🇪🇸 Rafael Nadal</th>
                  <th>🇨🇭 Roger Federer</th>
                  <th>🇪🇸 Carlos Alcaraz</th>
                  <th>🇮🇹 Jannik Sinner</th>
                </tr>
              </thead>
              <tbody>
                <tr className="animate-in" style={{ animationDelay: '0.1s' }}>
                  <td>Grand Slams</td>
                  <td className="highlight-cell">24 👑</td>
                  <td>22</td>
                  <td>20</td>
                  <td>4</td>
                  <td>2</td>
                </tr>
                <tr className="animate-in" style={{ animationDelay: '0.2s' }}>
                  <td>ATP Masters 1000</td>
                  <td className="highlight-cell">40 👑</td>
                  <td>36</td>
                  <td>28</td>
                  <td>5</td>
                  <td>4</td>
                </tr>
                <tr className="animate-in" style={{ animationDelay: '0.3s' }}>
                  <td>ATP Finals</td>
                  <td className="highlight-cell">7 👑</td>
                  <td>0</td>
                  <td>6</td>
                  <td>0</td>
                  <td>1</td>
                </tr>
                <tr className="animate-in" style={{ animationDelay: '0.4s' }}>
                  <td>Olympic Singles Gold</td>
                  <td className="highlight-cell">1 🥇</td>
                  <td className="highlight-cell">1 🥇</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                </tr>
                <tr className="total-row animate-in" style={{ animationDelay: '0.5s' }}>
                  <td>Total "Big Titles"</td>
                  <td className="highlight-cell" style={{ fontSize: '1.4rem' }}>72 👑</td>
                  <td>59</td>
                  <td>54</td>
                  <td>9</td>
                  <td>7</td>
                </tr>
              </tbody>
            </table>
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
        
        /* ---- Cinematic Hero Video CSS ---- */
        .hero-video-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }
        
        .hero-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 15%; /* Favor the top to ensure the head is visible */
        }
        
        .hero-video-overlay {
          position: absolute;
          inset: 0;
          background: 
            linear-gradient(to bottom, transparent 60%, var(--color-bg-primary) 100%),
            linear-gradient(to right, var(--color-bg-primary) 0%, transparent 30%, transparent 70%, var(--color-bg-primary) 100%),
            rgba(10, 15, 25, 0.5); /* Base tint for text legibility */
        }

        
        .table-container {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow-x: auto;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        
        .big-titles-table {
          width: 100%;
          border-collapse: collapse;
          text-align: center;
          font-family: var(--font-sans);
        }
        
        .big-titles-table th {
          padding: var(--space-md);
          font-weight: 700;
          color: var(--color-text-secondary);
          border-bottom: 2px solid var(--color-border);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .big-titles-table th:first-child {
          text-align: left;
        }
        
        .big-titles-table tr {
          transition: background-color var(--transition-normal), transform var(--transition-normal);
        }
        
        .big-titles-table tbody tr:hover {
          background-color: rgba(255, 255, 255, 0.03);
          transform: scale(1.01);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border-radius: var(--radius-md);
        }
        
        .big-titles-table td {
          padding: var(--space-md);
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text);
          font-variant-numeric: tabular-nums;
          transition: color var(--transition-fast);
        }
        
        .highlight-cell {
          color: var(--color-accent) !important;
          font-weight: 700;
          text-shadow: 0 0 10px rgba(46, 213, 115, 0.4);
        }
        
        .big-titles-table td:first-child {
          text-align: left;
          font-weight: 600;
          color: var(--color-text-secondary);
        }
        
        .big-titles-table tr:last-child td {
          border-bottom: none;
        }
        
        .big-titles-table .total-row td {
          font-weight: 700;
          color: var(--color-accent);
          background: linear-gradient(90deg, rgba(46, 213, 115, 0.05) 0%, rgba(46, 213, 115, 0.15) 50%, rgba(46, 213, 115, 0.05) 100%);
          font-size: 1.1rem;
          border-top: 2px solid var(--color-accent);
        }
        
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
  let logoPath = '';
  let color = 'var(--color-accent)';
  let menChamp = 'TBD';
  let womenChamp = 'TBD';
  let slug = 'australian-open';
  let displayName = t.name;

  if (nameLower.includes('australian')) {
    slug = 'australian-open';
    logoPath = '/trophies/ao.svg';
    color = '#005BBB'; // AO Blue
    menChamp = '🇮🇹 Jannik Sinner';
    womenChamp = '🏳️ Aryna Sabalenka';
    displayName = 'AUSTRALIAN OPEN';
  } else if (nameLower.includes('roland') || nameLower.includes('french')) {
    slug = 'roland-garros';
    logoPath = '/trophies/fo.svg';
    color = '#CB5A36'; // Roland Garros Clay
    menChamp = '🇪🇸 Carlos Alcaraz';
    womenChamp = '🇵🇱 Iga Świątek';
    displayName = 'ROLAND-GARROS';
  } else if (nameLower.includes('wimbledon')) {
    slug = 'wimbledon';
    logoPath = '/trophies/wim.svg';
    color = '#006B3F'; // Wimbledon Green
    menChamp = '🇪🇸 Carlos Alcaraz';
    womenChamp = '🇨🇿 Barbora Krejčíková';
    displayName = 'WIMBLEDON';
  } else if (nameLower.includes('us open')) {
    slug = 'us-open';
    logoPath = '/trophies/uso.svg';
    color = '#002868'; // US Open Blue
    menChamp = '🇮🇹 Jannik Sinner';
    womenChamp = '🏳️ Aryna Sabalenka';
    displayName = 'US OPEN';
  }

  const isCompleted = t.status === 'completed';
  const champLabel = isCompleted ? 'Champ:' : 'Defending:';

  return (
    <Link href={`/tournaments/${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="gs-card animate-in" style={{ '--gs-color': color } as React.CSSProperties}>
        <div className="gs-card__header" style={{ alignItems: 'center' }}>
        <div className="gs-card__name" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
        <div className="gs-card__logo">
          {logoPath ? (
            <img 
              src={logoPath} 
              alt={`${t.name} Trophy`} 
              style={{ 
                height: '70px', 
                width: 'auto', 
                filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.4))',
                transition: 'transform 0.3s ease'
              }} 
            />
          ) : '🎾'}
        </div>
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
    </Link>
  );
}
