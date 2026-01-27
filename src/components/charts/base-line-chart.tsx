'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

/**
 * Theme-aware line chart wrapper using Recharts.
 *
 * Uses CSS custom properties for colors to match dark theme.
 * Respects prefers-reduced-motion by disabling animations.
 *
 * @example
 * ```tsx
 * const data = [
 *   { season: 2020, wins: 9, losses: 2 },
 *   { season: 2021, wins: 11, losses: 2 },
 * ];
 *
 * <BaseLineChart
 *   data={data}
 *   xAxisKey="season"
 *   lines={[
 *     { dataKey: 'wins', name: 'Wins', color: 'var(--chart-1)' },
 *     { dataKey: 'losses', name: 'Losses', color: 'var(--chart-3)' },
 *   ]}
 * />
 * ```
 */

export interface LineConfig {
  dataKey: string;
  name: string;
  color: string;
  /** Dash pattern for colorblind accessibility. Auto-assigned if not provided. */
  strokeDasharray?: string;
}

/**
 * Default stroke patterns for colorblind accessibility.
 * Each line gets a distinct pattern so charts remain readable
 * without relying on color alone.
 */
const DEFAULT_STROKE_PATTERNS = [
  undefined, // Solid line (first line)
  '8 4', // Long dashes (second line)
  '2 2', // Dotted (third line)
  '8 4 2 4', // Dash-dot (fourth line)
  '12 4', // Extra long dashes (fifth line)
];

export interface BaseLineChartProps<T extends Record<string, unknown>> {
  data: T[];
  xAxisKey: keyof T & string;
  lines: LineConfig[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  yAxisDomain?: [number | 'auto' | 'dataMin' | 'dataMax', number | 'auto' | 'dataMin' | 'dataMax'];
  xAxisLabel?: string;
  yAxisLabel?: string;
  tooltipFormatter?: (
    value: number | string | undefined,
    name: string | undefined,
    props: unknown,
    index: number
  ) => [string, string] | string | undefined;
  className?: string;
}

export function BaseLineChart<T extends Record<string, unknown>>({
  data,
  xAxisKey,
  lines,
  height = 300,
  showGrid = true,
  showLegend = true,
  yAxisDomain = [0, 'dataMax'],
  xAxisLabel,
  yAxisLabel,
  tooltipFormatter,
  className,
}: BaseLineChartProps<T>) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
          )}
          <XAxis
            dataKey={xAxisKey}
            stroke="var(--color-muted-foreground)"
            fontSize={14}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
            label={
              xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: 'insideBottom',
                    offset: -5,
                    fill: 'var(--color-muted-foreground)',
                    fontSize: 12,
                  }
                : undefined
            }
          />
          <YAxis
            stroke="var(--color-muted-foreground)"
            fontSize={14}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
            domain={yAxisDomain}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: 'insideLeft',
                    fill: 'var(--color-muted-foreground)',
                    fontSize: 12,
                  }
                : undefined
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-popover-foreground)',
              fontSize: 12,
            }}
            labelStyle={{
              color: 'var(--color-popover-foreground)',
              fontWeight: 600,
              marginBottom: 4,
            }}
            formatter={tooltipFormatter}
            cursor={{ stroke: 'var(--color-muted-foreground)', strokeOpacity: 0.3 }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{
                fontSize: 12,
                color: 'var(--color-foreground)',
              }}
            />
          )}
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              strokeDasharray={
                line.strokeDasharray ??
                DEFAULT_STROKE_PATTERNS[index % DEFAULT_STROKE_PATTERNS.length]
              }
              dot={{ fill: line.color, strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              isAnimationActive={!prefersReducedMotion}
              animationDuration={prefersReducedMotion ? 0 : 300}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
