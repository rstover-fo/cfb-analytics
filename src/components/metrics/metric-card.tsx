import { Card, CardContent } from '@/components/ui/card';

export interface MetricItem {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
}

interface MetricCardProps {
  metric: MetricItem;
}

/**
 * Individual metric display card.
 * Shows label, formatted value, and optional unit/description.
 * Uses tabular-nums for consistent numeric alignment.
 */
export function MetricCard({ metric }: MetricCardProps) {
  const formattedValue =
    typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value;

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <dl>
          <dt className="text-muted-foreground text-xs">{metric.label}</dt>
          <dd className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-semibold tabular-nums">{formattedValue}</span>
            {metric.unit && <span className="text-muted-foreground text-sm">{metric.unit}</span>}
          </dd>
          {metric.description && (
            <dd className="text-muted-foreground mt-1 text-xs">{metric.description}</dd>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
