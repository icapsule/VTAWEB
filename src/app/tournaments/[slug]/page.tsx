import React from 'react';
import { notFound } from 'next/navigation';
import gsHistory from '@/lib/data/grand-slams-history.json';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = (gsHistory as any)[slug];
  if (!data) return { title: 'Tournament Not Found' };
  return { title: `${data.name} History & Honor Roll | VTAWEB` };
}

export default async function GrandSlamDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = (gsHistory as any)[slug];
  
  if (!data) {
    notFound();
  }

  // Calculate Honor Roll (players with >= 2 championships)
  const championCounts = data.champions.reduce((acc: any, curr: any) => {
    // curr.champion is just the name now, e.g., "Novak Djokovic"
    acc[curr.champion] = (acc[curr.champion] || 0) + 1;
    return acc;
  }, {});

  const honorRoll = Object.entries(championCounts)
    .filter(([_, count]: any) => count >= 2)
    .sort((a: any, b: any) => b[1] - a[1]); // Sort by count descending
    
  const top3 = honorRoll.slice(0, 3);
  const others = honorRoll.slice(3);

  // Helper for flags
  const getFlagEmoji = (countryCode: string) => {
    const flags: Record<string, string> = {
      SRB: '🇷🇸', ESP: '🇪🇸', SUI: '🇨🇭', USA: '🇺🇸', SWE: '🇸🇪', 
      AUS: '🇦🇺', GBR: '🇬🇧', GER: '🇩🇪', FRG: '🇩🇪', RUS: '🇷🇺',
      ITA: '🇮🇹', ARG: '🇦🇷', CRO: '🇭🇷', AUT: '🇦🇹', CZE: '🇨🇿',
      TCH: '🇨🇿', ROU: '🇷🇴', RSA: '🇿🇦', NED: '🇳🇱', ECU: '🇪🇨',
      BRA: '🇧🇷', FRA: '🇫🇷', CHI: '🇨🇱', CYP: '🇨🇾', GRE: '🇬🇷',
      NOR: '🇳🇴', CAN: '🇨🇦', JPN: '🇯🇵'
    };
    return flags[countryCode] || '🏳️';
  };

  return (
    <div className="page-content slam-detail">
      <div className="container">
        {/* Back Link */}
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <Link href="/" className="back-link">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Hero Section */}
        <div className="slam-hero animate-in" style={{ '--slam-color': data.color } as React.CSSProperties}>
          <div className="slam-hero__logo">
            <img src={data.trophy} alt={data.name} className="slam-trophy-img" />
          </div>
          <div className="slam-hero__info">
            <h1 className="slam-title">{data.name}</h1>
            <p className="slam-meta">
              📍 {data.location} &nbsp;|&nbsp; 🎾 Surface: {data.surface}
            </p>
          </div>
        </div>

        {/* Honor Roll */}
        {honorRoll.length > 0 && (
          <section className="honor-roll-section animate-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="section-title">🏆 Honor Roll (2+ Titles)</h2>
            
            {/* Top 3 Podium */}
            <div className="podium-container">
              {top3.length > 1 && (
                <div className="podium-step podium-second">
                  <div className="podium-rank">2nd</div>
                  <div className="honor-count">{top3[1][1]}x</div>
                  <div className="honor-name">{top3[1][0]}</div>
                </div>
              )}
              {top3.length > 0 && (
                <div className="podium-step podium-first">
                  <div className="podium-rank">1st</div>
                  <div className="honor-count">{top3[0][1]}x</div>
                  <div className="honor-name" style={{ color: 'var(--color-accent)' }}>{top3[0][0]}</div>
                </div>
              )}
              {top3.length > 2 && (
                <div className="podium-step podium-third">
                  <div className="podium-rank">3rd</div>
                  <div className="honor-count">{top3[2][1]}x</div>
                  <div className="honor-name">{top3[2][0]}</div>
                </div>
              )}
            </div>

            {/* Others Grid */}
            {others.length > 0 && (
              <div className="honor-roll-grid" style={{ marginTop: 'var(--space-xl)' }}>
                {others.map(([player, count]: any) => (
                  <div key={player} className="honor-roll-card">
                    <div className="honor-count" style={{ fontSize: '1.4rem' }}>{count}x</div>
                    <div className="honor-name" style={{ fontSize: '0.85rem' }}>{player}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Historical Table */}
        <section className="history-section animate-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="section-title">📜 Open Era Champions</h2>
          <div className="table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Champion</th>
                  <th>Runner-Up</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {data.champions.map((match: any) => (
                  <tr key={match.year}>
                    <td className="year-cell">{match.year}</td>
                    <td className="champ-cell">
                      <span className="flag-icon" title={match.champCountry}>{getFlagEmoji(match.champCountry)}</span>
                      <strong>{match.champion}</strong>
                    </td>
                    <td className="runner-cell">
                      <span className="flag-icon" title={match.runnerCountry}>{getFlagEmoji(match.runnerCountry)}</span>
                      {match.runnerUp}
                    </td>
                    <td className="score-cell">{match.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <style>{`
        .slam-detail {
          padding-bottom: var(--space-2xl);
        }
        .back-link {
          color: var(--color-text-secondary);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: var(--color-accent);
        }
        .slam-hero {
          display: flex;
          align-items: center;
          gap: var(--space-xl);
          background: linear-gradient(135deg, rgba(20,25,40,0.8), rgba(10,15,25,0.9));
          border: 1px solid var(--slam-color);
          border-radius: var(--radius-lg);
          padding: var(--space-2xl);
          margin-bottom: var(--space-2xl);
          box-shadow: 0 10px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05);
          position: relative;
          overflow: hidden;
        }
        .slam-hero::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at top right, var(--slam-color), transparent 60%);
          opacity: 0.15;
          pointer-events: none;
        }
        .slam-hero__logo {
          flex-shrink: 0;
        }
        .slam-trophy-img {
          height: 140px;
          width: auto;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.6));
        }
        .slam-hero__info {
          flex: 1;
        }
        .slam-title {
          font-size: 3rem;
          font-family: var(--font-display);
          font-weight: 800;
          margin-bottom: var(--space-xs);
          background: linear-gradient(to right, #fff, rgba(255,255,255,0.7));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .slam-meta {
          color: var(--color-text-secondary);
          font-size: 1.1rem;
        }

        /* Honor Roll */
        .honor-roll-section {
          margin-bottom: var(--space-2xl);
        }
        .honor-roll-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: var(--space-md);
        }
        .honor-roll-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-md);
          text-align: center;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
        }
        .honor-roll-card:hover {
          transform: translateY(-5px) scale(1.05);
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
          border-color: var(--slam-color, var(--color-accent));
        }
        .honor-count {
          font-size: 2rem;
          font-weight: 900;
          font-family: var(--font-display);
          color: var(--color-accent);
          margin-bottom: var(--space-xs);
          text-shadow: 0 2px 10px rgba(56, 189, 248, 0.3);
        }
        .honor-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }
        
        .podium-container {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: var(--space-md);
          margin: var(--space-xl) 0;
          min-height: 200px;
        }
        .podium-step {
          background: linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-card) 100%);
          border: 1px solid var(--color-border);
          border-bottom: none;
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          padding: var(--space-lg);
          text-align: center;
          flex: 1;
          max-width: 200px;
          position: relative;
          box-shadow: 0 -10px 30px rgba(0,0,0,0.2);
        }
        .podium-first {
          height: 180px;
          border-color: #fbbf24;
          z-index: 3;
          background: linear-gradient(180deg, rgba(251, 191, 36, 0.1) 0%, var(--color-bg-card) 100%);
        }
        .podium-second {
          height: 140px;
          border-color: #94a3b8;
          z-index: 2;
          background: linear-gradient(180deg, rgba(148, 163, 184, 0.1) 0%, var(--color-bg-card) 100%);
        }
        .podium-third {
          height: 110px;
          border-color: #b45309;
          z-index: 1;
          background: linear-gradient(180deg, rgba(180, 83, 9, 0.1) 0%, var(--color-bg-card) 100%);
        }
        .podium-rank {
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--color-text-secondary);
        }
        .podium-first .podium-rank { color: #fbbf24; border-color: #fbbf24; }
        .podium-second .podium-rank { color: #94a3b8; border-color: #94a3b8; }
        .podium-third .podium-rank { color: #b45309; border-color: #b45309; }
        
        .flag-icon {
          margin-right: 8px;
          font-size: 1.1rem;
        }

        /* History Table */
        .history-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .history-table th {
          padding: var(--space-md);
          font-weight: 700;
          color: var(--color-text-secondary);
          border-bottom: 2px solid var(--color-border);
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
        }
        .history-table td {
          padding: var(--space-md);
          border-bottom: 1px solid var(--color-border);
          font-variant-numeric: tabular-nums;
        }
        .history-table tbody tr {
          transition: background 0.2s;
        }
        .history-table tbody tr:hover {
          background: rgba(255,255,255,0.03);
        }
        .year-cell {
          color: var(--color-text-muted);
          font-weight: 600;
        }
        .champ-cell {
          color: var(--color-accent);
        }
        .runner-cell {
          color: var(--color-text-secondary);
        }
        .score-cell {
          color: var(--color-text-muted);
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .slam-hero {
            flex-direction: column;
            text-align: center;
            padding: var(--space-xl);
          }
          .slam-title { font-size: 2.2rem; }
        }
      `}</style>
    </div>
  );
}
