import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Search, Calendar, BarChart3, Users, FileQuestion, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './button';

const emptyStateVariants = cva('flex flex-col items-center justify-center text-center px-4 py-8', {
  variants: {
    size: {
      sm: 'py-6 gap-2',
      default: 'py-8 gap-3',
      lg: 'py-12 gap-4',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

const iconVariants = cva('text-muted-foreground', {
  variants: {
    size: {
      sm: 'size-8',
      default: 'size-12',
      lg: 'size-16',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

type EmptyStatePreset = 'no-results' | 'no-games' | 'no-stats' | 'no-recruits' | 'no-data';

interface PresetConfig {
  icon: LucideIcon;
  title: string;
  description: string;
}

const presets: Record<EmptyStatePreset, PresetConfig> = {
  'no-results': {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filter criteria.',
  },
  'no-games': {
    icon: Calendar,
    title: 'No games scheduled',
    description: 'There are no games matching your current filters.',
  },
  'no-stats': {
    icon: BarChart3,
    title: 'No statistics available',
    description: 'Statistics for this selection are not yet available.',
  },
  'no-recruits': {
    icon: Users,
    title: 'No recruits found',
    description: 'No recruiting data matches your current criteria.',
  },
  'no-data': {
    icon: FileQuestion,
    title: 'No data available',
    description: 'The requested data could not be found.',
  },
};

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
}

interface EmptyStateProps
  extends React.ComponentProps<'div'>, VariantProps<typeof emptyStateVariants> {
  /** Use a preset configuration for common scenarios */
  preset?: EmptyStatePreset;
  /** Custom icon (overrides preset) */
  icon?: LucideIcon;
  /** Title text (overrides preset) */
  title?: string;
  /** Description text (overrides preset) */
  description?: string;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
}

function EmptyState({
  className,
  size,
  preset,
  icon: customIcon,
  title: customTitle,
  description: customDescription,
  action,
  secondaryAction,
  children,
  ...props
}: EmptyStateProps) {
  const presetConfig = preset ? presets[preset] : null;

  const Icon = customIcon ?? presetConfig?.icon ?? FileQuestion;
  const title = customTitle ?? presetConfig?.title ?? 'No data';
  const description = customDescription ?? presetConfig?.description;

  return (
    <div
      data-slot="empty-state"
      role="status"
      aria-live="polite"
      className={cn(emptyStateVariants({ size, className }))}
      {...props}
    >
      <div className={cn(iconVariants({ size }))}>
        <Icon className="size-full" aria-hidden="true" />
      </div>

      <div className="space-y-1">
        <h3
          className={cn(
            'text-foreground font-semibold',
            size === 'sm' && 'text-sm',
            size === 'lg' && 'text-lg'
          )}
        >
          {title}
        </h3>

        {description && (
          <p
            className={cn(
              'text-muted-foreground max-w-sm',
              size === 'sm' && 'text-xs',
              size === 'default' && 'text-sm',
              size === 'lg' && 'text-base'
            )}
          >
            {description}
          </p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {action && (
            <Button
              variant={action.variant ?? 'default'}
              size={size === 'sm' ? 'sm' : 'default'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant ?? 'outline'}
              size={size === 'sm' ? 'sm' : 'default'}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

export { EmptyState, type EmptyStateProps, type EmptyStatePreset, type EmptyStateAction };
