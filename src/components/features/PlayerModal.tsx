"use client";

import React, { useEffect, useState } from 'react';
import { getCountryFlag } from '@/lib/utils';

export interface PlayerModalProps {
  player: {
    rank: number;
    name: string;
    country: string;
    points: number;
  } | null;
  onClose: () => void;
}

interface WikiData {
  extract?: string;
  thumbnail?: {
    source: string;
  };
}

export function PlayerModal({ player, onClose }: PlayerModalProps) {
  const [wikiData, setWikiData] = useState<WikiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!player) {
      setWikiData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setWikiData(null);

    // Format the name for Wikipedia API (e.g., "Jannik Sinner" -> "Jannik_Sinner")
    const searchName = encodeURIComponent(player.name.replace(/ /g, '_'));

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${searchName}`)
      .then((res) => {
        if (!res.ok) throw new Error('Wikipedia article not found');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setWikiData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setError('Could not load Wikipedia profile.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [player]);

  // Handle escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!player) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {loading ? (
            <div className="loader-spinner"></div>
          ) : (
            <>
              {wikiData?.thumbnail?.source ? (
                <img 
                  src={wikiData.thumbnail.source} 
                  alt={player.name} 
                  className="player-avatar" 
                />
              ) : (
                <div 
                  className="player-avatar" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'var(--color-bg-elevated)',
                    fontSize: '3rem'
                  }}
                >
                  {getCountryFlag(player.country)}
                </div>
              )}
            </>
          )}

          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800 }}>
            {player.name}
          </h3>
          
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', marginTop: 'var(--space-xs)' }}>
            <span className="badge badge--live">Rank #{player.rank}</span>
            <span className="badge" style={{ background: 'var(--color-bg-elevated)' }}>
              {player.points.toLocaleString()} PTS
            </span>
            <span className="badge" style={{ background: 'var(--color-bg-elevated)' }}>
              {getCountryFlag(player.country)} {player.country}
            </span>
          </div>

          {!loading && !error && wikiData?.extract && (
            <div className="player-bio">
              {wikiData.extract}
            </div>
          )}
          
          {!loading && error && (
            <div className="player-bio" style={{ color: 'var(--color-accent-red)' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
