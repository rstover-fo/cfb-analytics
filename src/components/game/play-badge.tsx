'use client';

import {
  Footprints,
  Target,
  XCircle,
  Shield,
  ArrowUp,
  Zap,
  CheckCircle,
  AlertTriangle,
  Flag,
  Clock,
  AlertOctagon,
  Trophy,
  RotateCcw,
  Plus,
  Minus,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Badge configuration for play types.
 * Maps play types to their visual representation.
 */
interface BadgeConfig {
  label: string;
  color: string;
  icon: LucideIcon;
}

/**
 * Get badge configuration for a play type.
 * Falls back to "Other" for unrecognized types.
 */
function getBadgeConfig(playType: string): BadgeConfig {
  const normalized = playType.toLowerCase();

  // Rush plays
  if (normalized === 'rush' || normalized === 'rushing touchdown') {
    return { label: 'Rush', color: 'bg-blue-600', icon: Footprints };
  }

  // Pass completions and touchdowns
  if (
    normalized === 'pass reception' ||
    normalized === 'pass completion' ||
    normalized === 'passing touchdown'
  ) {
    return { label: 'Pass', color: 'bg-green-600', icon: Target };
  }

  // Incomplete passes
  if (normalized === 'pass incompletion' || normalized === 'pass') {
    return { label: 'Incomplete', color: 'bg-gray-500', icon: XCircle };
  }

  // Sack
  if (normalized === 'sack') {
    return { label: 'Sack', color: 'bg-red-600', icon: Shield };
  }

  // Punt plays
  if (
    normalized === 'punt' ||
    normalized === 'blocked punt' ||
    normalized === 'blocked punt touchdown'
  ) {
    return { label: 'Punt', color: 'bg-gray-500', icon: ArrowUp };
  }

  // Kickoff plays
  if (
    normalized === 'kickoff' ||
    normalized === 'kickoff return (offense)' ||
    normalized === 'kickoff return (defense)'
  ) {
    return { label: 'Kickoff', color: 'bg-yellow-500', icon: Zap };
  }

  // Field goal good
  if (normalized === 'field goal good') {
    return { label: 'FG Good', color: 'bg-green-600', icon: CheckCircle };
  }

  // Field goal missed
  if (normalized === 'field goal missed' || normalized === 'missed field goal return touchdown') {
    return { label: 'FG Miss', color: 'bg-red-600', icon: XCircle };
  }

  // Turnovers (interceptions and fumbles lost)
  if (
    normalized === 'pass interception' ||
    normalized === 'interception' ||
    normalized === 'interception return touchdown' ||
    normalized === 'fumble' ||
    normalized === 'fumble recovery (opponent)' ||
    normalized === 'fumble return touchdown'
  ) {
    return { label: 'Turnover', color: 'bg-red-600', icon: AlertTriangle };
  }

  // Penalty
  if (normalized === 'penalty') {
    return { label: 'Penalty', color: 'bg-yellow-500', icon: Flag };
  }

  // PAT good
  if (
    normalized === 'extra point good' ||
    normalized === '2pt conversion' ||
    normalized === 'two point pass' ||
    normalized === 'two point rush'
  ) {
    return { label: 'PAT', color: 'bg-green-600', icon: Plus };
  }

  // PAT missed
  if (normalized === 'extra point missed' || normalized === 'blocked pat') {
    return { label: 'PAT Miss', color: 'bg-red-600', icon: Minus };
  }

  // Game state / timeout
  if (
    normalized === 'timeout' ||
    normalized === 'end period' ||
    normalized === 'end of half' ||
    normalized === 'end of game' ||
    normalized === 'start of period' ||
    normalized === 'end of regulation'
  ) {
    return { label: 'Timeout', color: 'bg-gray-400', icon: Clock };
  }

  // Safety
  if (normalized === 'safety' || normalized === 'defensive 2pt conversion') {
    return { label: 'Safety', color: 'bg-purple-600', icon: AlertOctagon };
  }

  // Return touchdowns
  if (normalized === 'punt return touchdown' || normalized === 'kickoff return touchdown') {
    return { label: 'Return TD', color: 'bg-amber-500', icon: Trophy };
  }

  // Fumble recovery own team
  if (normalized === 'fumble recovery (own)') {
    return { label: 'Fumble Own', color: 'bg-gray-500', icon: RotateCcw };
  }

  // Punt return (non-TD)
  if (normalized === 'punt return') {
    return { label: 'Punt Ret', color: 'bg-gray-500', icon: ArrowUp };
  }

  // Blocked field goal (non-TD)
  if (normalized === 'blocked field goal') {
    return { label: 'Blocked FG', color: 'bg-red-600', icon: Shield };
  }

  // Default fallback
  return { label: 'Other', color: 'bg-gray-400', icon: HelpCircle };
}

export interface PlayBadgeProps {
  playType: string;
  className?: string;
}

/**
 * Badge component displaying play type with icon and color coding.
 */
export function PlayBadge({ playType, className }: PlayBadgeProps) {
  const config = getBadgeConfig(playType);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white',
        config.color,
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}

export interface PPAIndicatorProps {
  ppa: number | null;
  className?: string;
}

/**
 * Indicator showing Predicted Points Added with color coding.
 * Positive values are green, negative values are red.
 */
export function PPAIndicator({ ppa, className }: PPAIndicatorProps) {
  if (ppa === null) {
    return null;
  }

  const isPositive = ppa >= 0;
  const formatted = isPositive ? `+${ppa.toFixed(2)}` : ppa.toFixed(2);

  return (
    <span
      className={cn(
        'text-xs font-medium tabular-nums',
        isPositive ? 'text-green-600' : 'text-red-600',
        className
      )}
      title="Predicted Points Added"
    >
      {formatted}
    </span>
  );
}
