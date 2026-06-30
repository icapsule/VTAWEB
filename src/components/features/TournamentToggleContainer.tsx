"use client";

import React, { useState } from 'react';
import { formatDateRange, getSurfaceClass, getStatusBadgeClass } from '@/lib/utils';

export function TournamentToggleContainer({ allTournaments }: { allTournaments: any[] }) {
  const [tour, setTour] = useState<'atp' | 'wta'>('atp');
  const [tier, setTier] = useState<'1000' | '500' | '250' | 'Challenger'>('1000');
  const [year, setYear] = useState<'2026' | '2027'>('2026');

  // Filter for the current tour, EXCLUDE Grand Slams, match Year and match Tier
  const currentTournaments = allTournaments.filter(t => {
    if (t.tour !== tour) return false;
    if (t.category === 'Grand Slam') return false;
    
    // Safely check startDate (which is a Date object passed from page.tsx)
    if (!t.startDate || typeof t.startDate.getFullYear !== 'function' || t.startDate.getFullYear().toString() !== year) return false;
    
    if (tier === '1000') {
      return t.category.includes('1000') || t.category === 'Finals';
    } else if (tier === '500') {
      return t.category.includes('500');
    } else if (tier === '250') {
      return t.category.includes('250');
    } else if (tier === 'Challenger') {
      return t.category.toLowerCase().includes('challenger');
    }
    return false;
  });

  // Categorize
  const liveTournaments = currentTournaments.filter(t => t.status === 'live');
  const upcomingTournaments = currentTournaments.filter(t => t.status === 'upcoming');
  
  // Combine Live and Upcoming into "Upcoming", but Live at the top
  const combinedUpcoming = [...liveTournaments, ...upcomingTournaments];
  
  // Completed tournaments (sorted by newest first, so we reverse them since original is asc)
  const completedTournaments = currentTournaments.filter(t => t.status === 'completed').reverse();

  return (
    <div>
      {/* Top Level Controls: Year & Tour */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
        
        {/* Year Toggle */}
        <div className="toggle-group" style={{ display: 'flex', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-full)', padding: '6px' }}>
          {['2026', '2027'].map(y => (
            <button
              key={y}
              onClick={() => setYear(y as '2026' | '2027')}
              style={{
                padding: '8px 24px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: year === y ? 'var(--color-accent)' : 'transparent',
                color: year === y ? '#fff' : 'var(--color-text-secondary)',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Tour Toggle */}
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

      {/* Tier Level Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div className="tier-toggle-group" style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          {['1000', '500', '250', 'Challenger'].map((level) => (
            <button
              key={level}
              onClick={() => setTier(level as any)}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                border: tier === level ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                background: tier === level ? 'var(--color-bg-card)' : 'transparent',
                color: tier === level ? 'var(--color-accent)' : 'var(--color-text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              {level === '1000' ? 'Masters 1000 / Finals' : level === 'Challenger' ? 'Challenger' : `${tour.toUpperCase()} ${level}`}
            </button>
          ))}
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

const iocToIso: Record<string, string> = {
  'AUS': 'AU', 'USA': 'US', 'ESP': 'ES', 'FRA': 'FR', 'GBR': 'GB', 'GER': 'DE', 
  'ITA': 'IT', 'CHN': 'CN', 'JPN': 'JP', 'SUI': 'CH', 'CAN': 'CA', 'ARG': 'AR', 
  'BRA': 'BR', 'SRB': 'RS', 'CZE': 'CZ', 'POL': 'PL', 'ROU': 'RO', 'KAZ': 'KZ', 
  'QAT': 'QA', 'UAE': 'AE', 'KSA': 'SA', 'SWE': 'SE', 'NED': 'NL', 'MON': 'MC', 
  'MEX': 'MX', 'BEL': 'BE', 'AUT': 'AT', 'NZL': 'NZ', 'MAR': 'MA', 'COL': 'CO',
  'CRO': 'HR', 'SVK': 'SK', 'HUN': 'HU', 'BUL': 'BG', 'GRE': 'GR', 'TUR': 'TR',
  'POR': 'PT', 'CHI': 'CL', 'RSA': 'ZA', 'TPE': 'TW', 'KOR': 'KR', 'IND': 'IN',
  'FIN': 'FI', 'DEN': 'DK', 'NOR': 'NO', 'EST': 'EE', 'LAT': 'LV', 'LTU': 'LT',
  'UKR': 'UA', 'BLR': 'BY', 'RUS': 'RU'
};

function getCountryFlag(ioc: string) {
  if (!ioc || ioc === 'UNK') return '';
  const iso = iocToIso[ioc.toUpperCase()];
  if (!iso) return ioc;
  const flag = iso.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
  return `${ioc} ${flag}`;
}

function TournamentDetailCard({ tournament }: { tournament: any }) {
  const t = tournament;
  return (
    <div className="tournament-card animate-in" id={`tournament-detail-${t.id}`}>
      <div className="tournament-card__header">
        <div>
          <div className="tournament-card__name">{t.name}</div>
          <div className="tournament-card__location">📍 {t.city}{t.country !== 'UNK' && t.country ? `, ${getCountryFlag(t.country)}` : ''}</div>
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
