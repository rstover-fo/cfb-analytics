import { MetricGroup } from './metric-group';
import type { MetricItem } from './metric-card';
import type { DetailedMetrics } from '@/lib/db/queries';

interface MetricsGridProps {
  metrics: DetailedMetrics;
}

/**
 * Layout component that organizes DetailedMetrics into categorized groups.
 * Categories: Offense, Defense, Situational
 */
export function MetricsGrid({ metrics }: MetricsGridProps) {
  const offenseMetrics: MetricItem[] = [
    {
      label: 'Points Per Game',
      value: metrics.ppgOffense.toFixed(1),
    },
    {
      label: 'Yards Per Game',
      value: metrics.ypgOffense.toFixed(1),
    },
    {
      label: 'Total Yards',
      value: metrics.totalYardsOffense,
    },
    {
      label: 'Yards Per Play',
      value: metrics.yardsPerPlay.toFixed(2),
    },
    {
      label: '3rd Down %',
      value: `${metrics.thirdDownPct}%`,
    },
  ];

  const defenseMetrics: MetricItem[] = [
    {
      label: 'Points Allowed/Game',
      value: metrics.ppgDefense.toFixed(1),
    },
    {
      label: 'Yards Allowed/Game',
      value: metrics.ypgDefense.toFixed(1),
    },
    {
      label: 'Total Yards Allowed',
      value: metrics.totalYardsDefense,
    },
  ];

  const situationalMetrics: MetricItem[] = [
    {
      label: 'Turnover Margin',
      value:
        metrics.turnoverMargin > 0
          ? `+${metrics.turnoverMargin}`
          : metrics.turnoverMargin.toString(),
      description: `${metrics.turnoversGained} gained, ${metrics.turnoversLost} lost`,
    },
    {
      label: 'Red Zone TD %',
      value: `${metrics.redZoneTdPct}%`,
      description: `${metrics.redZoneAttempts} attempts`,
    },
  ];

  return (
    <div className="space-y-8">
      <MetricGroup title="Offense" metrics={offenseMetrics} />
      <MetricGroup title="Defense" metrics={defenseMetrics} />
      <MetricGroup title="Situational" metrics={situationalMetrics} />
    </div>
  );
}

/**
 * Skeleton loading state for the metrics grid.
 */
export function MetricsGridSkeleton() {
  return (
    <div className="space-y-8">
      {/* Offense skeleton */}
      <div className="space-y-3">
        <div className="bg-muted h-4 w-20 animate-pulse rounded" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card h-24 animate-pulse rounded-lg border" />
          ))}
        </div>
      </div>
      {/* Defense skeleton */}
      <div className="space-y-3">
        <div className="bg-muted h-4 w-20 animate-pulse rounded" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card h-24 animate-pulse rounded-lg border" />
          ))}
        </div>
      </div>
      {/* Situational skeleton */}
      <div className="space-y-3">
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-card h-24 animate-pulse rounded-lg border" />
          ))}
        </div>
      </div>
    </div>
  );
}
