import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SeasonRecord } from '@/lib/db/queries';

interface RecordCardProps {
  record: SeasonRecord | null;
}

export function RecordCard({ record }: RecordCardProps) {
  if (!record) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Season Record</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const winPct = record.games > 0 ? ((record.wins / record.games) * 100).toFixed(0) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{record.season} Season Record</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums">
            {record.wins}-{record.losses}
          </span>
          <span className="text-muted-foreground text-sm tabular-nums">({winPct}%)</span>
        </div>
        <div className="text-muted-foreground mt-1 text-sm">
          Conference:{' '}
          <span className="tabular-nums">
            {record.confWins}-{record.confLosses}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4 border-t pt-3">
          <div>
            <div className="text-muted-foreground text-xs">Points For</div>
            <div className="text-lg font-semibold tabular-nums">{record.pointsFor}</div>
            <div className="text-muted-foreground text-xs tabular-nums">
              {(record.pointsFor / record.games).toFixed(1)} PPG
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Points Against</div>
            <div className="text-lg font-semibold tabular-nums">{record.pointsAgainst}</div>
            <div className="text-muted-foreground text-xs tabular-nums">
              {(record.pointsAgainst / record.games).toFixed(1)} PPG
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
