import { Trophy, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { HeadToHeadRecord } from '@/lib/db/queries';

interface H2HRecordCardProps {
  record: HeadToHeadRecord | null;
  opponent: string;
}

/**
 * Card displaying the head-to-head record against an opponent.
 * Shows wins, losses, and total games with icons for accessibility.
 */
export function H2HRecordCard({ record, opponent }: H2HRecordCardProps) {
  if (!record) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>vs {opponent}</CardTitle>
          <CardDescription>Since 2014</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No matchups found against {opponent}.</p>
        </CardContent>
      </Card>
    );
  }

  const winPct = record.totalGames > 0 ? (record.wins / record.totalGames) * 100 : 0;

  return (
    <Card aria-live="polite" aria-atomic="true">
      <CardHeader>
        <CardTitle>vs {record.opponent}</CardTitle>
        <CardDescription>Since 2014</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="text-chart-2 h-5 w-5" aria-hidden="true" />
              <span className="text-4xl font-bold tabular-nums">{record.wins}</span>
            </div>
            <p className="text-muted-foreground text-sm">Wins</p>
          </div>

          <div className="text-muted-foreground text-2xl font-light">-</div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <XCircle className="text-chart-3 h-5 w-5" aria-hidden="true" />
              <span className="text-4xl font-bold tabular-nums">{record.losses}</span>
            </div>
            <p className="text-muted-foreground text-sm">Losses</p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-muted-foreground text-sm">
            {record.totalGames} total games ({winPct.toFixed(0)}% win rate)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
