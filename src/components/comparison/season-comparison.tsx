import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComparisonRow } from './comparison-row';
import type { SeasonComparison as SeasonComparisonData } from '@/lib/db/queries';

interface SeasonComparisonProps {
  comparison: SeasonComparisonData;
}

/**
 * Main season comparison component.
 * Displays side-by-side metrics with delta highlighting.
 * Organized by category: Offense, Defense, Situational.
 */
export function SeasonComparison({ comparison }: SeasonComparisonProps) {
  const { season1, season2, deltas } = comparison;

  const formatPct = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(1)}%`;
  };

  const formatNum = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toFixed(1);
  };

  const formatInt = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num > 0 ? `+${num}` : String(num);
  };

  return (
    <div className="space-y-6">
      {/* Offensive Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Offense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead>
                <tr className="border-border border-b">
                  <th scope="col" className="pr-4 pb-2 text-left text-xs font-medium">
                    Metric
                  </th>
                  <th scope="col" className="px-4 pb-2 text-right text-xs font-medium tabular-nums">
                    {season1.season}
                  </th>
                  <th scope="col" className="px-4 pb-2 text-right text-xs font-medium tabular-nums">
                    {season2.season}
                  </th>
                  <th scope="col" className="pb-2 pl-4 text-right text-xs font-medium">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  label="Points Per Game"
                  value1={season1.ppgOffense}
                  value2={season2.ppgOffense}
                  delta={deltas.ppgOffense}
                  formatValue={formatNum}
                />
                <ComparisonRow
                  label="Yards Per Game"
                  value1={season1.ypgOffense}
                  value2={season2.ypgOffense}
                  delta={deltas.ypgOffense}
                  formatValue={formatNum}
                />
                <ComparisonRow
                  label="3rd Down %"
                  value1={season1.thirdDownPct}
                  value2={season2.thirdDownPct}
                  delta={deltas.thirdDownPct}
                  formatValue={formatPct}
                />
                <ComparisonRow
                  label="Red Zone TD %"
                  value1={season1.redZoneTdPct}
                  value2={season2.redZoneTdPct}
                  delta={deltas.redZoneTdPct}
                  formatValue={formatPct}
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Defensive Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Defense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead>
                <tr className="border-border border-b">
                  <th scope="col" className="pr-4 pb-2 text-left text-xs font-medium">
                    Metric
                  </th>
                  <th scope="col" className="px-4 pb-2 text-right text-xs font-medium tabular-nums">
                    {season1.season}
                  </th>
                  <th scope="col" className="px-4 pb-2 text-right text-xs font-medium tabular-nums">
                    {season2.season}
                  </th>
                  <th scope="col" className="pb-2 pl-4 text-right text-xs font-medium">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  label="Points Per Game Allowed"
                  value1={season1.ppgDefense}
                  value2={season2.ppgDefense}
                  delta={deltas.ppgDefense}
                  formatValue={formatNum}
                />
                <ComparisonRow
                  label="Yards Per Game Allowed"
                  value1={season1.ypgDefense}
                  value2={season2.ypgDefense}
                  delta={deltas.ypgDefense}
                  formatValue={formatNum}
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Situational Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Situational</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead>
                <tr className="border-border border-b">
                  <th scope="col" className="pr-4 pb-2 text-left text-xs font-medium">
                    Metric
                  </th>
                  <th scope="col" className="px-4 pb-2 text-right text-xs font-medium tabular-nums">
                    {season1.season}
                  </th>
                  <th scope="col" className="px-4 pb-2 text-right text-xs font-medium tabular-nums">
                    {season2.season}
                  </th>
                  <th scope="col" className="pb-2 pl-4 text-right text-xs font-medium">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  label="Turnover Margin"
                  value1={season1.turnoverMargin}
                  value2={season2.turnoverMargin}
                  delta={deltas.turnoverMargin}
                  formatValue={formatInt}
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Skeleton loader for the season comparison component.
 * Matches the structure of the comparison display.
 */
export function SeasonComparisonSkeleton() {
  return (
    <div className="space-y-6">
      {/* Offense skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <div className="bg-muted h-4 w-16 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="bg-muted h-4 w-32 animate-pulse rounded" />
                <div className="flex gap-4">
                  <div className="bg-muted h-4 w-12 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-12 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Defense skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <div className="bg-muted h-4 w-16 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="bg-muted h-4 w-40 animate-pulse rounded" />
                <div className="flex gap-4">
                  <div className="bg-muted h-4 w-12 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-12 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Situational skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <div className="bg-muted h-4 w-20 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="bg-muted h-4 w-32 animate-pulse rounded" />
              <div className="flex gap-4">
                <div className="bg-muted h-4 w-12 animate-pulse rounded" />
                <div className="bg-muted h-4 w-12 animate-pulse rounded" />
                <div className="bg-muted h-4 w-16 animate-pulse rounded" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
