"use client";

import React, { useState } from 'react';
import { formatRankChange, getCountryFlag } from '@/lib/utils';
import { PlayerModal } from './PlayerModal';

interface Player {
  rank: number;
  name: string;
  country: string;
  points: number;
  change: number;
}

interface RankingsSectionProps {
  standardRankings: Player[];
  raceRankings: Player[];
  tour: 'atp' | 'wta';
  title: string;
  raceTitle: string;
}

export function RankingsSection({
  standardRankings,
  raceRankings,
  tour,
  title,
  raceTitle,
}: RankingsSectionProps) {
  const [isRace, setIsRace] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  
  const currentRankings = isRace ? raceRankings : standardRankings;

  return (
    <section id={`${tour}-rankings-container`} style={{ marginBottom: 'var(--space-3xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span className={`badge badge--${tour}`} style={{ fontSize: '0.9rem', padding: '4px 14px' }}>
            {tour.toUpperCase()}
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>
            {isRace ? raceTitle : title}
          </h2>
        </div>

        <div className="toggle-group" style={{ display: 'flex', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-full)', padding: '4px' }}>
          <button
            onClick={() => setIsRace(false)}
            className={`toggle-btn ${!isRace ? 'active' : ''}`}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: !isRace ? 'var(--color-accent)' : 'transparent',
              color: !isRace ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            52-Week
          </button>
          <button
            onClick={() => setIsRace(true)}
            className={`toggle-btn ${isRace ? 'active' : ''}`}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: isRace ? (tour === 'atp' ? '#00f' : '#8a2be2') : 'transparent',
              color: isRace ? '#fff' : 'var(--color-text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Race To {tour === 'atp' ? 'Turin' : 'Finals'}
          </button>
        </div>
      </div>

      <FullRankingsTable 
        rankings={currentRankings} 
        tour={tour} 
        isRace={isRace} 
        onPlayerClick={setSelectedPlayer}
      />
      
      <PlayerModal 
        player={selectedPlayer} 
        onClose={() => setSelectedPlayer(null)} 
      />
    </section>
  );
}

function FullRankingsTable({ rankings, tour, isRace, onPlayerClick }: { rankings: Player[], tour: string, isRace: boolean, onPlayerClick: (p: Player) => void }) {
  return (
    <div className="data-table-wrapper">
      <table className="data-table" id={`${tour}-${isRace ? 'race' : 'full'}-rankings-table`}>
        <thead>
          <tr>
            <th style={{ width: '60px' }}>Rank</th>
            <th>Player</th>
            <th style={{ width: '80px' }}>Country</th>
            <th style={{ width: '120px', textAlign: 'right' }}>Points</th>
            <th style={{ width: '70px', textAlign: 'center' }}>+/-</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((player) => {
            const change = formatRankChange(player.change);
            return (
              <tr 
                key={`${tour}-${isRace ? 'race' : 'std'}-${player.rank}`}
                onClick={() => onPlayerClick(player)}
                style={{ cursor: 'pointer' }}
              >
                <td className={`rank-cell ${player.rank <= 3 ? 'rank-cell--top3' : ''}`}>
                  {player.rank}
                </td>
                <td>
                  <div className="player-name">{player.name}</div>
                </td>
                <td>
                  <span className="player-country" title={player.country}>
                    <span style={{ marginRight: '6px', fontSize: '1.2em' }}>{getCountryFlag(player.country)}</span>
                    {player.country}
                  </span>
                </td>
                <td className="points-cell" style={{ textAlign: 'right' }}>
                  {player.points.toLocaleString()}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className={change.className}>{change.text}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
