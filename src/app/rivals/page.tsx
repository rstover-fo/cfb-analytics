import { Suspense } from 'react';
import { Metadata } from 'next';
import {
  RivalSelector,
  H2HRecordCard,
  MatchupsTable,
  ScoringTrendChart,
} from '@/components/rivals';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAllOpponents,
  getHeadToHeadRecord,
  getHeadToHeadGames,
  getHeadToHeadScoringTrend,
} from '@/lib/db/queries';

export const metadata: Metadata = {
  title: 'Oklahoma Sooners - Head-to-Head Records',
  description: 'Head-to-head records and matchup history against rivals and opponents since 2014',
};

interface PageProps {
  searchParams: Promise<{ opponent?: string }>;
}

// Default opponent if none selected
const DEFAULT_OPPONENT = 'Texas';

async function RivalsContent({ opponent }: { opponent: string }) {
  const [record, games, scoringTrend] = await Promise.all([
    getHeadToHeadRecord(opponent),
    getHeadToHeadGames(opponent),
    getHeadToHeadScoringTrend(opponent),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <H2HRecordCard record={record} opponent={opponent} />

        <Card>
          <CardHeader>
            <CardTitle>Scoring Trend</CardTitle>
            <CardDescription>Points scored by each team per matchup</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoringTrendChart data={scoringTrend} opponent={opponent} height={220} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Matchups</CardTitle>
          <CardDescription>Complete game history since 2014</CardDescription>
        </CardHeader>
        <CardContent>
          <MatchupsTable games={games} opponent={opponent} />
        </CardContent>
      </Card>
    </div>
  );
}

function RivalsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mx-auto h-24 w-48" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[220px] w-full" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function RivalsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const allOpponents = await getAllOpponents();

  // Validate opponent selection
  const requestedOpponent = params.opponent || DEFAULT_OPPONENT;
  const validOpponent =
    allOpponents.find((opp) => opp.toLowerCase() === requestedOpponent.toLowerCase()) ||
    DEFAULT_OPPONENT;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Head-to-Head Records</h1>
          <p className="text-muted-foreground text-sm">
            Matchup history against rivals and opponents (Since 2014)
          </p>
        </div>
        <RivalSelector allOpponents={allOpponents} selectedOpponent={validOpponent} />
      </div>

      <Suspense key={validOpponent} fallback={<RivalsSkeleton />}>
        <RivalsContent opponent={validOpponent} />
      </Suspense>
    </div>
  );
}
