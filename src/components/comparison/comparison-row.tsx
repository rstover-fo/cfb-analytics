import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeltaValue } from '@/lib/db/queries';

interface ComparisonRowProps {
  label: string;
  value1: number | string;
  value2: number | string;
  delta: DeltaValue;
  unit?: string;
  /** Format function for display values */
  formatValue?: (value: number | string) => string;
}

/**
 * Individual metric row for the comparison table.
 * Shows both season values side-by-side with delta highlighting.
 * Uses icons for direction (not color-only) per a11y requirements.
 */
export function ComparisonRow({
  label,
  value1,
  value2,
  delta,
  unit,
  formatValue = (v) => String(v),
}: ComparisonRowProps) {
  const deltaColor =
    delta.direction === 'improvement'
      ? 'text-green-600 dark:text-green-400'
      : delta.direction === 'decline'
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground';

  const DeltaIcon =
    delta.direction === 'improvement' ? ArrowUp : delta.direction === 'decline' ? ArrowDown : Minus;

  const formattedDelta =
    delta.absolute > 0 ? `+${delta.absolute}` : delta.absolute < 0 ? String(delta.absolute) : '0';

  return (
    <tr className="border-border border-b last:border-0">
      <th scope="row" className="text-muted-foreground py-3 pr-4 text-left text-sm font-medium">
        {label}
      </th>
      <td className="px-4 py-3 text-right tabular-nums">
        <span className="text-sm">
          {formatValue(value1)}
          {unit && <span className="text-muted-foreground ml-1 text-xs">{unit}</span>}
        </span>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        <span className="text-sm">
          {formatValue(value2)}
          {unit && <span className="text-muted-foreground ml-1 text-xs">{unit}</span>}
        </span>
      </td>
      <td className="py-3 pl-4 text-right">
        <span className={cn('inline-flex items-center gap-1 text-sm', deltaColor)}>
          <DeltaIcon className="h-3 w-3" aria-hidden="true" />
          <span className="tabular-nums">{formattedDelta}</span>
          <span className="sr-only">
            {delta.direction === 'improvement'
              ? '(improved)'
              : delta.direction === 'decline'
                ? '(declined)'
                : '(unchanged)'}
          </span>
        </span>
      </td>
    </tr>
  );
}
