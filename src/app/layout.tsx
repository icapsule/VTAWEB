import './globals.css';

export const metadata = {
  title: 'VTAWEB — Live Tennis Rankings & Tournaments',
  description: 'Real-time ATP and WTA tennis rankings, tournament schedules, and match results. Automatically updated daily.',
  keywords: ['tennis', 'ATP', 'WTA', 'ITF', 'rankings', 'tournaments', 'live scores'],
  openGraph: {
    title: 'VTAWEB — Live Tennis Rankings & Tournaments',
    description: 'Real-time ATP and WTA tennis rankings, tournament schedules, and match results.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

/* ---- Navbar Component (inline for App Router layout) ---- */
function Navbar() {
  return (
    <nav className="navbar" id="main-nav">
      <div className="container navbar__inner">
        <a href="/" className="navbar__brand" id="nav-brand">
          <span className="navbar__logo">🎾</span>
          <span className="navbar__name">VTAWEB</span>
        </a>
        <ul className="navbar__links" id="nav-links">
          <li><a href="/" className="navbar__link">Dashboard</a></li>
          <li><a href="/rankings" className="navbar__link">Rankings</a></li>
          <li className="navbar__dropdown">
            <a href="/tournaments" className="navbar__link">Tournaments ▾</a>
            <ul className="navbar__dropdown-menu">
              <li><a href="/tournaments">📅 Tournament Calendar</a></li>
              <li><a href="/tournaments/australian-open">🏆 Australian Open</a></li>
              <li><a href="/tournaments/roland-garros">🏆 Roland Garros</a></li>
              <li><a href="/tournaments/wimbledon">🏆 Wimbledon</a></li>
              <li><a href="/tournaments/us-open">🏆 US Open</a></li>
            </ul>
          </li>
        </ul>
        <div className="navbar__right-spacer"></div>
      </div>

      <style>{`
        .navbar {
          position: sticky;
          top: var(--space-md);
          z-index: 100;
          height: var(--nav-height);
          max-width: 800px;
          margin: 0 auto;
          background: rgba(15, 20, 35, 0.65);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-full);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }
        .navbar__inner {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-lg);
        }
        .navbar__brand {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.3rem;
          color: var(--color-text-primary);
          transition: opacity var(--transition-fast);
        }
        .navbar__brand:hover { opacity: 0.8; }
        .navbar__logo { font-size: 1.5rem; }
        .navbar__name {
          background: linear-gradient(135deg, var(--color-text-primary), var(--color-accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .navbar__links {
          display: flex;
          gap: var(--space-xs);
        }
        .navbar__right-spacer {
          flex: 1;
        }
        .navbar__link {
          padding: var(--space-sm) var(--space-md);
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }
        .navbar__link:hover {
          color: var(--color-text-primary);
          background: var(--color-bg-card);
        }
        
        /* Dropdown CSS */
        .navbar__dropdown {
          position: relative;
        }
        .navbar__dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          background: rgba(15, 20, 35, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          min-width: 220px;
          padding: var(--space-xs) 0;
          display: none;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          animation: slideDown 0.2s ease-out;
        }
        .navbar__dropdown:hover .navbar__dropdown-menu {
          display: flex;
        }
        .navbar__dropdown-menu li {
          list-style: none;
        }
        .navbar__dropdown-menu a {
          display: block;
          padding: var(--space-sm) var(--space-md);
          color: var(--color-text-secondary);
          font-size: 0.9rem;
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        .navbar__dropdown-menu a:hover {
          background: rgba(255,255,255,0.05);
          color: var(--color-text-primary);
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .navbar__status {
          display: flex;
          align-items: center;
        }
        @media (max-width: 768px) {
          .navbar__status { display: none; }
          .navbar__links { gap: 0; }
          .navbar__link {
            padding: var(--space-sm) var(--space-sm);
            font-size: 0.8rem;
          }
        }
      `}</style>
    </nav>
  );
}

/* ---- Footer Component ---- */
function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <span>🎾 VTAWEB</span>
          <p className="footer__tagline">Automated tennis data, updated daily.</p>
        </div>
        
        <div className="footer__official-links">
          <a href="https://www.atptour.com/en" target="_blank" rel="noopener noreferrer" className="footer__logo-link" title="ATP Tour Official">
            <svg viewBox="0 0 100 40" width="70" height="28" fill="currentColor">
              <text x="5" y="32" fontFamily="Arial Black, Impact, sans-serif" fontSize="32" fontStyle="italic" fontWeight="900" letterSpacing="-2">ATP</text>
              <path d="M 0,22 Q 40,16 95,16 Q 50,20 0,26 Z" fill="currentColor" />
            </svg>
          </a>
          <a href="https://www.wtatennis.com/" target="_blank" rel="noopener noreferrer" className="footer__logo-link" title="WTA Official">
            <svg viewBox="0 0 100 40" width="70" height="28" fill="currentColor">
              <text x="2" y="32" fontFamily="Arial Black, Impact, sans-serif" fontSize="32" fontStyle="italic" fontWeight="900" letterSpacing="-3">WTA</text>
            </svg>
          </a>
        </div>

        <div className="footer__meta">
          <p>Data sourced from open tennis databases.</p>
          <p>Built with Next.js • Deployed on Vercel</p>
        </div>
      </div>

      <style>{`
        .footer {
          border-top: 1px solid var(--color-border);
          padding: var(--space-2xl) 0;
          background: var(--color-bg-secondary);
        }
        .footer__inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-lg);
        }
        .footer__brand {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.1rem;
        }
        .footer__tagline {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin-top: var(--space-xs);
        }
        .footer__official-links {
          display: flex;
          align-items: center;
          gap: var(--space-xl);
          opacity: 0.5;
          transition: opacity var(--transition-fast);
        }
        .footer__official-links:hover {
          opacity: 1;
        }
        .footer__logo-link {
          color: var(--color-text-muted);
          transition: color var(--transition-fast), transform var(--transition-fast);
          display: flex;
        }
        .footer__logo-link:hover {
          color: var(--color-text);
          transform: scale(1.05);
        }
        .footer__meta {
          text-align: right;
          font-size: 0.8rem;
          color: var(--color-text-muted);
          line-height: 1.8;
        }
        @media (max-width: 768px) {
          .footer__inner {
            flex-direction: column;
            text-align: center;
          }
          .footer__meta { text-align: center; }
        }
      `}</style>
    </footer>
  );
}
