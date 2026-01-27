import { Suspense } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { SeasonSelector } from '@/components/dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getAvailableSeasons, getAllGames } from '@/lib/db';

interface PageProps {
  searchParams: Promise<{ season?: string; page?: string }>;
}

async function GamesTable({ season, page }: { season?: number; page: number }) {
  const limit = 20;
  const offset = (page - 1) * limit;
  const { games, total } = await getAllGames(season, limit, offset);
  const totalPages = Math.ceil(total / limit);

  if (games.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No games found for this season.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-[100px]">
              Date
            </TableHead>
            <TableHead scope="col" className="w-[80px]">
              Week
            </TableHead>
            <TableHead scope="col">Opponent</TableHead>
            <TableHead scope="col" className="w-[100px] text-center">
              Result
            </TableHead>
            <TableHead scope="col" className="w-[100px] text-center">
              Score
            </TableHead>
            <TableHead scope="col" className="hidden md:table-cell">
              Venue
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((game) => (
            <TableRow key={game.id} className="hover:bg-accent/50">
              <TableCell className="font-mono text-sm">
                {new Date(game.startDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: '2-digit',
                })}
              </TableCell>
              <TableCell>{game.week}</TableCell>
              <TableCell>
                <Link
                  href={`/games/${game.id}`}
                  className="hover:text-primary font-medium hover:underline"
                >
                  {game.isHome ? 'vs' : '@'} {game.opponent}
                </Link>
              </TableCell>
              <TableCell className="text-center">
                {game.result ? (
                  <Badge
                    variant="secondary"
                    className={game.result === 'W' ? 'bg-green-600' : 'bg-red-600'}
                  >
                    {game.result === 'W' ? (
                      <Check className="mr-1 h-3 w-3" aria-hidden="true" />
                    ) : (
                      <X className="mr-1 h-3 w-3" aria-hidden="true" />
                    )}
                    {game.result}
                  </Badge>
                ) : (
                  <Badge variant="outline">TBD</Badge>
                )}
              </TableCell>
              <TableCell className="text-center font-mono tabular-nums">
                {game.result ? `${game.ouScore}-${game.oppScore}` : '-'}
              </TableCell>
              <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                {game.venue}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm tabular-nums">
            Showing {offset + 1}&ndash;{Math.min(offset + limit, total)} of {total} games
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/games?${season ? `season=${season}&` : ''}page=${page - 1}`}>
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/games?${season ? `season=${season}&` : ''}page=${page + 1}`}>
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-0">
      {/* Table header skeleton */}
      <div className="flex h-10 items-center gap-2 border-b px-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[80px]" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="hidden h-4 w-[150px] md:block" />
      </div>
      {/* Table rows skeleton */}
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex h-12 items-center gap-2 border-b px-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-[50px] rounded-full" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="hidden h-4 w-[150px] md:block" />
        </div>
      ))}
    </div>
  );
}

export default async function GamesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const seasons = await getAvailableSeasons();
  const currentSeason = params.season ? parseInt(params.season, 10) : undefined;
  const page = params.page ? parseInt(params.page, 10) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Game Explorer</h1>
          <p className="text-muted-foreground text-sm">
            {currentSeason ? `${currentSeason} Season` : 'All Games (2001-2025)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SeasonSelector seasons={seasons} currentSeason={currentSeason || 0} />
          {currentSeason && (
            <Button asChild variant="secondary" size="sm">
              <Link href="/games">Show All</Link>
            </Button>
          )}
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <GamesTable season={currentSeason} page={page} />
      </Suspense>
    </div>
  );
}
