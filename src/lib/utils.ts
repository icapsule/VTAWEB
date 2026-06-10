/**
 * Utility functions for VTAWEB.
 */

/**
 * Format a date string to a human-readable format.
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string}
 */
export function formatDate(dateStr, options = {}) {
  const defaults = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', { ...defaults, ...options });
}

/**
 * Format a date range (e.g., "Jun 15 – Jun 21, 2026").
 * @param {string} start - ISO date string
 * @param {string} end - ISO date string
 * @returns {string}
 */
export function formatDateRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth();
  const sameYear = s.getFullYear() === e.getFullYear();

  const startStr = s.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  if (sameMonth && sameYear) {
    const endStr = e.toLocaleDateString('en-US', {
      day: 'numeric',
      year: 'numeric',
    });
    return `${startStr} – ${endStr}`;
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
 * @param {string} surface
 * @returns {string}
 */
export function getSurfaceClass(surface) {
  const map = {
    Hard: 'surface--hard',
    Clay: 'surface--clay',
    Grass: 'surface--grass',
    Indoor: 'surface--indoor',
  };
  return map[surface] || '';
}

/**
 * Get the CSS class for a tournament/match status badge.
 * @param {string} status
 * @returns {string}
 */
export function getStatusBadgeClass(status) {
  const map = {
    live: 'badge--live',
    upcoming: 'badge--upcoming',
    completed: 'badge--completed',
  };
  return map[status] || '';
}

/**
 * Format the relative time since last update.
 * @param {string} isoString
 * @returns {string}
 */
export function timeAgo(isoString) {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now - then;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

/**
 * Format ranking change as a string with direction indicator.
 * @param {number} change - positive = up, negative = down, 0 = stable
 * @returns {{ text: string, className: string }}
 */
export function formatRankChange(change) {
  if (change > 0) return { text: `▲ ${change}`, className: 'change--up' };
  if (change < 0) return { text: `▼ ${Math.abs(change)}`, className: 'change--down' };
  return { text: '—', className: 'change--stable' };
}

/**
 * Get country flag emoji from 3-letter IOC code.
 * @param {string} iocCode
 * @returns {string}
 */
export function getCountryFlag(iocCode) {
  const map = {
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
