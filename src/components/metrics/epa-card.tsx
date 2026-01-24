import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUp, ArrowDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SeasonEPA } from '@/lib/db/queries';

interface EPACardProps {
  data: SeasonEPA;
}

/**
 * Get color class based on EPA value.
 * >0.1 = green (good), -0.1 to 0.1 = gray (average), <-0.1 = red (poor)
 */
function getEPAColor(epa: number): string {
  if (epa > 0.1) return 'text-green-500';
  if (epa < -0.1) return 'text-red-500';
  return 'text-muted-foreground';
}

/**
 * Get direction icon based on EPA value.
 */
function EPADirectionIcon({ epa }: { epa: number }) {
  if (epa > 0.1) {
    return <ArrowUp className="h-4 w-4 text-green-500" aria-hidden="true" />;
  }
  if (epa < -0.1) {
    return <ArrowDown className="h-4 w-4 text-red-500" aria-hidden="true" />;
  }
  return <Minus className="text-muted-foreground h-4 w-4" aria-hidden="true" />;
}

/**
 * Format EPA value with sign prefix.
 * Shows + for positive, - for negative values.
 */
function formatEPA(epa: number): string {
  const formatted = epa.toFixed(3);
  return epa > 0 ? `+${formatted}` : formatted;
}

/**
 * EPA (Expected Points Added) display card.
 * Shows overall EPA/play, rush EPA/play, and pass EPA/play with direction indicators.
 *
 * EPA is calculated from CFBD's PPA (Predicted Points Added) column.
 *
 * Color bands:
 * - >0.1 green + up arrow (good)
 * - -0.1 to 0.1 gray (average)
 * - <-0.1 red + down arrow (poor)
 */
export function EPACard({ data }: EPACardProps) {
  const metrics = [
    {
      label: 'Overall',
      value: data.epaPerPlay,
      plays: data.totalPlays,
    },
    {
      label: 'Rush',
      value: data.rushEpaPerPlay,
      plays: data.rushPlays,
    },
    {
      label: 'Pass',
      value: data.passEpaPerPlay,
      plays: data.passPlays,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          EPA / Play
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info
                  className="text-muted-foreground h-3.5 w-3.5 cursor-help"
                  aria-hidden="true"
                />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">
                  Expected Points Added per play, calculated using CFBD&apos;s Predicted Points
                  model. Higher values indicate more efficient offense.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EPADirectionIcon epa={metric.value} />
                <span className="text-muted-foreground text-sm">{metric.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={cn('text-xl font-semibold tabular-nums', getEPAColor(metric.value))}
                >
                  {formatEPA(metric.value)}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({metric.plays.toLocaleString()} plays)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no EPA data is available.
 */
export function EPACardEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">EPA / Play</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">No EPA data available for this season.</p>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading state for EPA card.
 */
export function EPACardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="bg-muted h-4 w-16 animate-pulse rounded" />
              <div className="bg-muted h-6 w-24 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
