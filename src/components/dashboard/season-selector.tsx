'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SeasonSelectorProps {
  seasons: number[];
  currentSeason: number;
}

export function SeasonSelector({ seasons, currentSeason }: SeasonSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSeasonChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('season', value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="season-select" className="text-sm font-medium">
        Season
      </label>
      <Select value={String(currentSeason)} onValueChange={handleSeasonChange}>
        <SelectTrigger id="season-select" className="w-[120px]">
          <SelectValue placeholder="Select season" />
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
  );
}
