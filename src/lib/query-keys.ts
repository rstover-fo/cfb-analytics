/**
 * Type-safe query key factory for React Query.
 *
 * Usage:
 *   queryKey: queryKeys.games.list({ season: 2024 })
 *   queryKey: queryKeys.games.detail(gameId)
 *   queryKey: queryKeys.recruiting.byTeam('Oklahoma')
 *
 * This pattern enables:
 * - Type-safe query keys throughout the app
 * - Easy invalidation of related queries
 * - Consistent key structure
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 */

export const queryKeys = {
  /** Game-related queries */
  games: {
    all: ['games'] as const,
    lists: () => [...queryKeys.games.all, 'list'] as const,
    list: (filters: { season?: number; team?: string; week?: number }) =>
      [...queryKeys.games.lists(), filters] as const,
    details: () => [...queryKeys.games.all, 'detail'] as const,
    detail: (gameId: string | number) =>
      [...queryKeys.games.details(), gameId] as const,
    plays: (gameId: string | number) =>
      [...queryKeys.games.detail(gameId), 'plays'] as const,
    drives: (gameId: string | number) =>
      [...queryKeys.games.detail(gameId), 'drives'] as const,
  },

  /** Team-related queries */
  teams: {
    all: ['teams'] as const,
    lists: () => [...queryKeys.teams.all, 'list'] as const,
    list: (filters?: { conference?: string }) =>
      [...queryKeys.teams.lists(), filters] as const,
    details: () => [...queryKeys.teams.all, 'detail'] as const,
    detail: (teamName: string) =>
      [...queryKeys.teams.details(), teamName] as const,
    schedule: (teamName: string, season: number) =>
      [...queryKeys.teams.detail(teamName), 'schedule', season] as const,
  },

  /** Recruiting queries */
  recruiting: {
    all: ['recruiting'] as const,
    classes: () => [...queryKeys.recruiting.all, 'classes'] as const,
    classByYear: (year: number) =>
      [...queryKeys.recruiting.classes(), year] as const,
    byTeam: (team: string, filters?: { year?: number }) =>
      [...queryKeys.recruiting.all, 'team', team, filters] as const,
    history: (team: string) =>
      [...queryKeys.recruiting.all, 'history', team] as const,
    positionGroups: (team: string, year: number) =>
      [...queryKeys.recruiting.all, 'positions', team, year] as const,
  },

  /** Transfer portal queries */
  transfers: {
    all: ['transfers'] as const,
    bySeason: (season: number) =>
      [...queryKeys.transfers.all, 'season', season] as const,
    byTeam: (team: string, filters?: { season?: number; direction?: 'in' | 'out' }) =>
      [...queryKeys.transfers.all, 'team', team, filters] as const,
  },

  /** Roster queries */
  roster: {
    all: ['roster'] as const,
    byTeam: (team: string, season?: number) =>
      [...queryKeys.roster.all, team, season] as const,
    byPosition: (team: string, position: string, season?: number) =>
      [...queryKeys.roster.byTeam(team, season), 'position', position] as const,
  },

  /** Stats/metrics queries */
  stats: {
    all: ['stats'] as const,
    team: (team: string, season: number) =>
      [...queryKeys.stats.all, 'team', team, season] as const,
    epa: (team: string, season: number) =>
      [...queryKeys.stats.all, 'epa', team, season] as const,
    trends: (team: string, filters?: { startYear?: number; endYear?: number }) =>
      [...queryKeys.stats.all, 'trends', team, filters] as const,
    rivals: (team: string, opponent: string) =>
      [...queryKeys.stats.all, 'rivals', team, opponent] as const,
  },

  /** Data freshness queries */
  freshness: {
    all: ['freshness'] as const,
    lastUpdated: (dataType: string) =>
      [...queryKeys.freshness.all, 'lastUpdated', dataType] as const,
  },
} as const;

/**
 * Type helper to extract the query key type for a specific query.
 */
export type QueryKeyType<T extends readonly unknown[]> = T;
