/**
 * Query exports for Sprint 6 data layers
 *
 * Barrel export for recruiting, transfer, and roster queries.
 */

// Recruiting queries
export {
  getClassSummary,
  getPositionBreakdown,
  getCommitTimeline,
  getClassRankingHistory,
  getTopRecruits,
  getPositionTrends,
  getConferencePeerComparison,
  getRecruitsByYear,
  getAvailableRecruitingYears,
} from './recruiting';

export type {
  ClassSummary,
  RecruitDetail,
  PositionBreakdown,
  CommitTimelineEntry,
  ClassRankingHistory,
  TopRecruit,
  PositionTrend,
  ConferencePeerComparison,
} from './recruiting';

// Transfer queries
export {
  getPortalDepartures,
  getPortalArrivals,
  getPortalImpact,
  getPortalHistory,
  getAvailablePortalYears,
} from './transfers';

export type {
  PortalDeparture,
  PortalArrival,
  PortalImpact,
  PositionCount,
  PortalSummary,
} from './transfers';

// Roster queries
export {
  getRosterByPosition,
  getExperienceBreakdown,
  getScholarshipCount,
  getRosterSummary,
  getAllRosterPlayers,
  getAvailableRosterYears,
} from './roster';

export type {
  RosterPlayer,
  PositionRosterGroup,
  ExperienceBreakdown,
  ScholarshipCount,
  RosterSummary,
} from './roster';
