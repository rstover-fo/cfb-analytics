'use client';

import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ComparisonHeaderProps {
  seasons: number[];
  season1: number;
  season2: number;
  onSeason1Change: (season: number) => void;
  onSeason2Change: (season: number) => void;
  onSwap: () => void;
}

/**
 * Header component for season comparison with two season selectors and swap button.
 * Manages the selection of which two seasons to compare.
 */
export function ComparisonHeader({
  seasons,
  season1,
  season2,
  onSeason1Change,
  onSeason2Change,
  onSwap,
}: ComparisonHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="season1-select" className="text-sm font-medium">
          Season 1
        </label>
        <Select
          value={String(season1)}
          onValueChange={(value) => onSeason1Change(parseInt(value, 10))}
        >
          <SelectTrigger id="season1-select" className="w-[100px]">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {seasons.map((season) => (
              <SelectItem key={season} value={String(season)}>
                {season}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="icon-sm"
        onClick={onSwap}
        aria-label="Swap seasons"
        title="Swap seasons"
      >
        <ArrowLeftRight className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2">
        <label htmlFor="season2-select" className="text-sm font-medium">
          Season 2
        </label>
        <Select
          value={String(season2)}
          onValueChange={(value) => onSeason2Change(parseInt(value, 10))}
        >
          <SelectTrigger id="season2-select" className="w-[100px]">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {seasons.map((season) => (
              <SelectItem key={season} value={String(season)}>
                {season}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
