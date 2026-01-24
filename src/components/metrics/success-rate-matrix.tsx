import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SuccessRateByDown, SuccessRateByDistance } from '@/lib/db/queries';

interface SuccessRateMatrixProps {
  byDown: SuccessRateByDown;
  byDistance: SuccessRateByDistance;
}

/**
 * Get cell styling based on success rate percentage.
 * >50% = green (good), 40-50% = yellow (average), <40% = red (poor)
 */
function getCellStyle(rate: number): { bgClass: string; textClass: string } {
  if (rate > 50) {
    return { bgClass: 'bg-green-500/20', textClass: 'text-green-500' };
  }
  if (rate >= 40) {
    return { bgClass: 'bg-yellow-500/20', textClass: 'text-yellow-500' };
  }
  return { bgClass: 'bg-red-500/20', textClass: 'text-red-500' };
}

/**
 * Icon indicator for success rate quality.
 */
function RateIcon({ rate }: { rate: number }) {
  if (rate > 50) {
    return <Check className="ml-1 inline-block h-3 w-3 text-green-500" aria-hidden="true" />;
  }
  if (rate < 40) {
    return <X className="ml-1 inline-block h-3 w-3 text-red-500" aria-hidden="true" />;
  }
  return null;
}

/**
 * Single cell in the success rate matrix.
 */
function MatrixCell({ rate, label }: { rate: number; label: string }) {
  const { bgClass, textClass } = getCellStyle(rate);

  return (
    <TableCell className={cn('text-center tabular-nums', bgClass)}>
      <span className={textClass} aria-label={`${label}: ${rate.toFixed(1)}%`}>
        {rate.toFixed(1)}%
        <RateIcon rate={rate} />
      </span>
    </TableCell>
  );
}

/**
 * Down x Distance success rate matrix table.
 * Shows success rates broken down by both down and distance-to-go.
 *
 * Rows: Downs (1st through 4th)
 * Columns: Distance categories (Short 1-3, Medium 4-6, Long 7+)
 *
 * Color coding:
 * - >50% green with check icon (good)
 * - 40-50% yellow (average)
 * - <40% red with X icon (poor)
 *
 * Accessibility:
 * - Uses proper table scope attributes
 * - ARIA labels on rate values
 */
export function SuccessRateMatrix({ byDown, byDistance }: SuccessRateMatrixProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Success Rate Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="w-24">
                Down
              </TableHead>
              <TableHead scope="col" className="text-center">
                Short (1-3)
              </TableHead>
              <TableHead scope="col" className="text-center">
                Medium (4-6)
              </TableHead>
              <TableHead scope="col" className="text-center">
                Long (7+)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableHead scope="row" className="font-medium">
                1st Down
              </TableHead>
              <MatrixCell rate={byDown.down1} label="1st down, short distance" />
              <MatrixCell rate={byDistance.medium} label="1st down, medium distance" />
              <MatrixCell rate={byDistance.long} label="1st down, long distance" />
            </TableRow>
            <TableRow>
              <TableHead scope="row" className="font-medium">
                2nd Down
              </TableHead>
              <MatrixCell rate={byDistance.short} label="2nd down, short distance" />
              <MatrixCell rate={byDown.down2} label="2nd down, medium distance" />
              <MatrixCell rate={byDistance.long} label="2nd down, long distance" />
            </TableRow>
            <TableRow>
              <TableHead scope="row" className="font-medium">
                3rd Down
              </TableHead>
              <MatrixCell rate={byDistance.short} label="3rd down, short distance" />
              <MatrixCell rate={byDistance.medium} label="3rd down, medium distance" />
              <MatrixCell rate={byDown.down3} label="3rd down, long distance" />
            </TableRow>
            <TableRow>
              <TableHead scope="row" className="font-medium">
                4th Down
              </TableHead>
              <MatrixCell rate={byDistance.short} label="4th down, short distance" />
              <MatrixCell rate={byDistance.medium} label="4th down, medium distance" />
              <MatrixCell rate={byDown.down4} label="4th down, long distance" />
            </TableRow>
          </TableBody>
        </Table>
        <p className="text-muted-foreground mt-3 text-xs">
          Success defined as positive EPA (expected points added) on the play.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Simplified success rate by distance display.
 * Shows just the distance breakdown without the full matrix.
 */
export function SuccessRateByDistanceCard({ data }: { data: SuccessRateByDistance }) {
  const distances = [
    { label: 'Short (1-3 yds)', value: data.short },
    { label: 'Medium (4-6 yds)', value: data.medium },
    { label: 'Long (7+ yds)', value: data.long },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Success Rate by Distance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {distances.map((dist) => {
            const { textClass } = getCellStyle(dist.value);
            return (
              <div key={dist.label} className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">{dist.label}</span>
                <span className={cn('text-lg font-semibold tabular-nums', textClass)}>
                  {dist.value.toFixed(1)}%
                  <RateIcon rate={dist.value} />
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no matrix data is available.
 */
export function SuccessRateMatrixEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Success Rate Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No down/distance data available for this season.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading state for success rate matrix.
 */
export function SuccessRateMatrixSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="bg-muted h-4 w-32 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted h-8 animate-pulse rounded" />
            ))}
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="bg-muted h-10 animate-pulse rounded" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
