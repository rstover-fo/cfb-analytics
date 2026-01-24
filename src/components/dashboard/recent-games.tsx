import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GameSummary } from '@/lib/db/queries';

interface RecentGamesProps {
  games: GameSummary[];
  title?: string;
}

export function RecentGames({ games, title = 'Recent Results' }: RecentGamesProps) {
  if (games.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No games found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.id}`}
            className="hover:bg-accent/50 -mx-2 flex items-center justify-between rounded-md px-2 py-2 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Badge
                variant={game.result === 'W' ? 'default' : 'secondary'}
                className={game.result === 'W' ? 'bg-green-600' : 'bg-red-600'}
              >
                {game.result}
              </Badge>
              <div>
                <div className="font-medium">
                  {game.isHome ? 'vs' : '@'} {game.opponent}
                </div>
                <div className="text-muted-foreground text-xs">
                  Week {game.week} &middot;{' '}
                  {new Date(game.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-semibold">
                {game.ouScore}-{game.oppScore}
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
