'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

/**
 * Theme-aware bar chart wrapper using Recharts.
 *
 * Uses CSS custom properties for colors to match dark theme.
 * Respects prefers-reduced-motion by disabling animations.
 *
 * @example
 * ```tsx
 * // Simple bar chart
 * const data = [
 *   { season: 2020, wins: 9 },
 *   { season: 2021, wins: 11 },
 * ];
 *
 * <BaseBarChart
 *   data={data}
 *   xAxisKey="season"
 *   bars={[{ dataKey: 'wins', name: 'Wins', color: 'var(--chart-1)' }]}
 * />
 *
 * // Stacked bar chart
 * <BaseBarChart
 *   data={data}
 *   xAxisKey="season"
 *   bars={[
 *     { dataKey: 'confWins', name: 'Conference', color: 'var(--chart-1)', stackId: 'wins' },
 *     { dataKey: 'nonConfWins', name: 'Non-Conference', color: 'var(--chart-2)', stackId: 'wins' },
 *   ]}
 * />
 * ```
 */

export interface BarConfig {
  dataKey: string;
  name: string;
  color: string;
  stackId?: string;
  /** Pattern ID for colorblind accessibility (e.g., 'striped', 'dotted') */
  pattern?: 'striped' | 'dotted' | 'crosshatch';
}

/**
 * SVG pattern definitions for colorblind accessibility.
 * These patterns overlay on top of colors to provide
 * non-color visual differentiation.
 */
function ChartPatterns() {
  return (
    <defs>
      <pattern
        id="pattern-striped"
        patternUnits="userSpaceOnUse"
        width="8"
        height="8"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
      </pattern>
      <pattern id="pattern-dotted" patternUnits="userSpaceOnUse" width="6" height="6">
        <circle cx="3" cy="3" r="1.5" fill="rgba(255,255,255,0.4)" />
      </pattern>
      <pattern id="pattern-crosshatch" patternUnits="userSpaceOnUse" width="8" height="8">
        <path d="M0,0 L8,8 M8,0 L0,8" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      </pattern>
    </defs>
  );
}

export interface BaseBarChartProps<T extends Record<string, unknown>> {
  data: T[];
  xAxisKey: keyof T & string;
  bars: BarConfig[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  layout?: 'horizontal' | 'vertical';
  yAxisDomain?: [number | 'auto' | 'dataMin' | 'dataMax', number | 'auto' | 'dataMin' | 'dataMax'];
  xAxisLabel?: string;
  yAxisLabel?: string;
  tooltipFormatter?: (
    value: number | string | undefined,
    name: string | undefined,
    props: unknown,
    index: number
  ) => [string, string] | string | undefined;
  barSize?: number;
  className?: string;
  /** Optional function to color individual bars based on data */
  getBarColor?: (entry: T, index: number, dataKey: string) => string;
}

export function BaseBarChart<T extends Record<string, unknown>>({
  data,
  xAxisKey,
  bars,
  height = 300,
  showGrid = true,
  showLegend = true,
  layout = 'horizontal',
  yAxisDomain = [0, 'dataMax'],
  xAxisLabel,
  yAxisLabel,
  tooltipFormatter,
  barSize,
  className,
  getBarColor,
}: BaseBarChartProps<T>) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={layout} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <ChartPatterns />
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              strokeOpacity={0.5}
              horizontal={layout === 'horizontal'}
              vertical={layout === 'vertical'}
            />
          )}
          <XAxis
            dataKey={layout === 'horizontal' ? xAxisKey : undefined}
            type={layout === 'horizontal' ? 'category' : 'number'}
            stroke="var(--color-muted-foreground)"
            fontSize={14}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
            domain={layout === 'vertical' ? yAxisDomain : undefined}
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
            dataKey={layout === 'vertical' ? xAxisKey : undefined}
            type={layout === 'vertical' ? 'category' : 'number'}
            stroke="var(--color-muted-foreground)"
            fontSize={14}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
            domain={layout === 'horizontal' ? yAxisDomain : undefined}
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
            cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.3 }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{
                fontSize: 12,
                color: 'var(--color-foreground)',
              }}
            />
          )}
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color}
              stackId={bar.stackId}
              barSize={barSize}
              radius={0}
              isAnimationActive={!prefersReducedMotion}
              animationDuration={prefersReducedMotion ? 0 : 300}
            >
              {getBarColor &&
                data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry, index, bar.dataKey)} />
                ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
