/**
 * Format utilities following Vercel UI guidelines
 * - Uses locale-aware formatting
 * - Ensures consistent number display
 */

/**
 * Format a number with locale-aware thousand separators
 */
export function formatNumber(value: number): string {
  return value.toLocaleString()
}

/**
 * Format a decimal number with specified precision
 */
export function formatDecimal(value: number, decimals: number = 2): string {
  return value.toFixed(decimals)
}

/**
 * Format a percentage value
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format a date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format a date with time
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Format a team record (e.g., "10-2")
 */
export function formatRecord(wins: number, losses: number, ties?: number): string {
  if (ties && ties > 0) {
    return `${wins}-${losses}-${ties}`
  }
  return `${wins}-${losses}`
}

/**
 * Format points with "pts" suffix and non-breaking space
 */
export function formatPoints(points: number): string {
  return `${points.toLocaleString()}\u00A0pts`
}

/**
 * Format a stat value based on its type
 */
export function formatStat(value: number, statType: string): string {
  // Stats that should show decimals
  const decimalStats = ['AVG', 'PCT', 'YPA', 'YPC', 'YPR', 'PPA', 'EPA']

  if (decimalStats.some(s => statType.toUpperCase().includes(s))) {
    return formatDecimal(value)
  }

  return formatNumber(value)
}
