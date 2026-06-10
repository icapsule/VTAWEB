"use client";

import React, { useState } from 'react';
import { RankingsSection } from './RankingsSection';

interface RankingsContainerProps {
  atpData: {
    standard: any[];
    race: any[];
  };
  wtaData: {
    standard: any[];
    race: any[];
  };
}

export function RankingsContainer({ atpData, wtaData }: RankingsContainerProps) {
  const [tour, setTour] = useState<'atp' | 'wta'>('atp');

  return (
    <div>
      {/* Top Level Tour Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div className="toggle-group" style={{ display: 'flex', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-full)', padding: '6px' }}>
          <button
            onClick={() => setTour('atp')}
            className={`toggle-btn ${tour === 'atp' ? 'active' : ''}`}
            style={{
              padding: '8px 24px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: tour === 'atp' ? '#00f' : 'transparent',
              color: tour === 'atp' ? '#fff' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            ATP Tour
          </button>
          <button
            onClick={() => setTour('wta')}
            className={`toggle-btn ${tour === 'wta' ? 'active' : ''}`}
            style={{
              padding: '8px 24px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: tour === 'wta' ? '#8a2be2' : 'transparent',
              color: tour === 'wta' ? '#fff' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            WTA Tour
          </button>
        </div>
      </div>

      {/* Render the selected Tour Rankings */}
      {tour === 'atp' ? (
        <RankingsSection
          tour="atp"
          title="Men's Singles Rankings"
          raceTitle="ATP Live Race to Turin"
          standardRankings={atpData.standard}
          raceRankings={atpData.race}
        />
      ) : (
        <RankingsSection
          tour="wta"
          title="Women's Singles Rankings"
          raceTitle="Race To The WTA Finals"
          standardRankings={wtaData.standard}
          raceRankings={wtaData.race}
        />
      )}
    </div>
  );
}
