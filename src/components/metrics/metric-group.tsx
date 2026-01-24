import { MetricCard, type MetricItem } from './metric-card';

interface MetricGroupProps {
  title: string;
  metrics: MetricItem[];
}

/**
 * Group of related metrics with a category header.
 * Renders metrics in a responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop.
 */
export function MetricGroup({ title, metrics }: MetricGroupProps) {
  if (metrics.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>
    </div>
  );
}
