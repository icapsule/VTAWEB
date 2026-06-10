"use client";

import React, { useState } from 'react';
import { formatDateRange, getSurfaceClass, getStatusBadgeClass } from '@/lib/utils';

export function TournamentToggleContainer({ allTournaments }: { allTournaments: any[] }) {
  const [tour, setTour] = useState<'atp' | 'wta'>('atp');

  // Filter for the current tour
  // Note: Grand Slams are marked with a specific tour in the db by the scraper (it inserts one for ATP and one for WTA)
  const currentTournaments = allTournaments.filter(t => t.tour === tour);

  // Categorize
  const liveTournaments = currentTournaments.filter(t => t.status === 'live');
  const upcomingTournaments = currentTournaments.filter(t => t.status === 'upcoming');
  
  // Combine Live and Upcoming into "Upcoming", but Live at the top
  const combinedUpcoming = [...liveTournaments, ...upcomingTournaments];
  
  // Completed tournaments (sorted by newest first, so we reverse them since original is asc)
  const completedTournaments = currentTournaments.filter(t => t.status === 'completed').reverse();

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

      {/* Upcoming Section */}
      {combinedUpcoming.length > 0 && (
        <section id="upcoming-tournaments" style={{ marginBottom: 'var(--space-3xl)' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.2rem',
            fontWeight: 700,
            marginBottom: 'var(--space-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}>
            <span className="badge badge--upcoming">Upcoming</span>
            Future & Live Events
          </h2>
          <div className="tournament-grid">
            {combinedUpcoming.map((t) => (
              <TournamentDetailCard key={t.id} tournament={t} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Section */}
      {completedTournaments.length > 0 && (
        <section id="completed-tournaments">
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.2rem',
            fontWeight: 700,
            marginBottom: 'var(--space-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}>
            <span className="badge badge--completed">Completed</span>
            Recent Events
          </h2>
          <div className="tournament-grid">
            {completedTournaments.map((t) => (
              <TournamentDetailCard key={t.id} tournament={t} />
            ))}
          </div>
        </section>
      )}

      {combinedUpcoming.length === 0 && completedTournaments.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-2xl)' }}>
          No tournaments found for {tour.toUpperCase()}.
        </div>
      )}
    </div>
  );
}

function TournamentDetailCard({ tournament }: { tournament: any }) {
  const t = tournament;
  return (
    <div className="tournament-card animate-in" id={`tournament-detail-${t.id}`}>
      <div className="tournament-card__header">
        <div>
          <div className="tournament-card__name">{t.name}</div>
          <div className="tournament-card__location">📍 {t.city}, {t.country === 'UNK' ? t.city : t.country}</div>
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
