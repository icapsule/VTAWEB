/**
 * Utility functions for VTAWEB.
 */

/**
 * Format a date string to a human-readable format.
 * @param dateStr - ISO date string (YYYY-MM-DD), timestamp, or Date object
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted string
 */
export function formatDate(dateStr: string | number | Date, options: Intl.DateTimeFormatOptions = {}): string {
  const defaults: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', { ...defaults, ...options });
}

/**
 * Format a date range (e.g., "Jun 15 – Jun 21, 2026").
 * @param start - ISO date string
 * @param end - ISO date string
 * @returns Formatted string
 */
export function formatDateRange(start: string | number | Date, end: string | number | Date): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth();
  const sameYear = s.getFullYear() === e.getFullYear();

  const startStr = s.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  if (sameMonth && sameYear) {
    return `${startStr} – ${e.getDate()}, ${e.getFullYear()}`;
  }

  if (sameYear && !sameMonth) {
    const endStr = e.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    return `${startStr} – ${endStr}, ${e.getFullYear()}`;
  }

  const endStr = e.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startStr} – ${endStr}`;
}

/**
 * Get the CSS class for a surface type.
 * @param surface
 * @returns CSS class string
 */
export function getSurfaceClass(surface: string): string {
  const map: Record<string, string> = {
    Hard: 'surface--hard',
    Clay: 'surface--clay',
    Grass: 'surface--grass',
    Indoor: 'surface--indoor',
  };
  return map[surface] || '';
}

/**
 * Get the CSS class for a tournament/match status badge.
 * @param status
 * @returns CSS class string
 */
export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    live: 'badge--live',
    upcoming: 'badge--upcoming',
    completed: 'badge--completed',
  };
  return map[status] || '';
}

/**
 * Format the relative time since last update.
 * @param isoString
 * @returns Formatted relative time string
 */
export function timeAgo(isoString: string | number | Date): string {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

/**
 * Format ranking change as a string with direction indicator.
 * @param change - positive = up, negative = down, 0 = stable
 * @returns Object with text and className
 */
export function formatRankChange(change: number): { text: string; className: string } {
  if (change > 0) return { text: `▲ ${change}`, className: 'change--up' };
  if (change < 0) return { text: `▼ ${Math.abs(change)}`, className: 'change--down' };
  return { text: '—', className: 'change--stable' };
}

/**
 * Get country flag emoji from 3-letter IOC code.
 * @param iocCode
 * @returns Flag emoji
 */
export function getCountryFlag(iocCode: string): string {
  const map: Record<string, string> = {
    'ITA': '🇮🇹', 'ESP': '🇪🇸', 'GER': '🇩🇪', 'SRB': '🇷🇸', 'RUS': '🇷🇺',
    'USA': '🇺🇸', 'NOR': '🇳🇴', 'DEN': '🇩🇰', 'BUL': '🇧🇬', 'AUS': '🇦🇺',
    'POL': '🇵🇱', 'GRE': '🇬🇷', 'BLR': '🇧🇾', 'KAZ': '🇰🇿', 'CHN': '🇨🇳',
    'CZE': '🇨🇿', 'FRA': '🇫🇷', 'GBR': '🇬🇧', 'CAN': '🇨🇦', 'SUI': '🇨🇭',
    'ARG': '🇦🇷', 'BRA': '🇧🇷', 'JPN': '🇯🇵', 'CRO': '🇭🇷', 'NED': '🇳🇱',
    'AUT': '🇦🇹', 'BEL': '🇧🇪', 'CHI': '🇨🇱', 'COL': '🇨🇴', 'FIN': '🇫🇮',
    'HUN': '🇭🇺', 'ISR': '🇮🇱', 'MEX': '🇲🇽', 'NZL': '🇳🇿', 'POR': '🇵🇹',
    'RSA': '🇿🇦', 'SVK': '🇸🇰', 'SWE': '🇸🇪', 'UKR': '🇺🇦', 'ROU': '🇷🇴',
    'LAT': '🇱🇻', 'EST': '🇪🇪', 'TPE': '🇹🇼', 'KOR': '🇰🇷', 'IND': '🇮🇳'
  };
  return map[iocCode] || '🏳️';
}
