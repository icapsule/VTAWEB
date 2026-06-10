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
          <li><a href="/tournaments" className="navbar__link">Tournaments</a></li>
        </ul>
        <div className="navbar__status" id="nav-status">
          <span className="updated-stamp">Auto-synced daily</span>
        </div>
      </div>

      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          height: var(--nav-height);
          background: rgba(10, 15, 28, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--color-border);
        }
        .navbar__inner {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-xl);
        }
        .navbar__brand {
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
