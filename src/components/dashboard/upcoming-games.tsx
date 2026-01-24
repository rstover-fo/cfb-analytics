import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GameSummary } from '@/lib/db/queries';

interface UpcomingGamesProps {
  games: GameSummary[];
}

export function UpcomingGames({ games }: UpcomingGamesProps) {
  if (games.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No upcoming games</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Upcoming Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.id}`}
            className="hover:bg-accent/50 -mx-2 flex items-center justify-between rounded-md px-2 py-2 transition-colors"
          >
            <div>
              <div className="font-medium">
                {game.isHome ? 'vs' : '@'} {game.opponent}
              </div>
              <div className="text-muted-foreground text-xs">
                Week {game.week} &middot;{' '}
                {new Date(game.startDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
            <div className="text-muted-foreground text-right text-xs">{game.venue}</div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
