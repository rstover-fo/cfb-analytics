import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SeasonStats } from '@/lib/db/queries';

interface StatsCardProps {
  stats: SeasonStats | null;
}

export function StatsCard({ stats }: StatsCardProps) {
  if (!stats) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Key Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No stats available</p>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    { label: 'PPG (Offense)', value: stats.ppgOffense.toFixed(1) },
    { label: 'PPG (Defense)', value: stats.ppgDefense.toFixed(1) },
    { label: 'Total Yards', value: stats.totalYards.toLocaleString() },
    { label: 'Yards/Play', value: stats.yardsPerPlay.toFixed(1) },
    { label: '3rd Down %', value: `${stats.thirdDownPct}%` },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{stats.season} Key Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {statItems.map((stat) => (
            <div key={stat.label}>
              <div className="text-muted-foreground text-xs">{stat.label}</div>
              <div className="text-xl font-semibold tabular-nums">{stat.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
