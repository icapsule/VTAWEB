import { atpRankings, wtaRankings, atpRaceRankings, wtaRaceRankings } from '@/lib/mock-data';
import { RankingsContainer } from '@/components/features/RankingsContainer';

export const metadata = {
  title: 'Tennis Rankings — ATP & WTA | VTAWEB',
  description: 'Complete ATP and WTA tennis rankings with points, country, and weekly changes.',
};

export default function RankingsPage() {
  return (
    <div className="page-content">
      <div className="container">
        <h1 className="section-title" style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
          Tennis Rankings
        </h1>

        <RankingsContainer 
          atpData={{ standard: atpRankings, race: atpRaceRankings }}
          wtaData={{ standard: wtaRankings, race: wtaRaceRankings }}
        />

        <div className="updated-stamp" style={{ marginTop: 'var(--space-xl)', justifyContent: 'center' }}>
          Rankings are updated daily from open tennis databases
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
