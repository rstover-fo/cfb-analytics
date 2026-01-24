'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface YearRangeSelectorProps {
  availableYears: number[];
  startYear: number;
  endYear: number;
}

/**
 * Year range selector for trend pages.
 * Updates URL params: ?start=2014&end=2024
 */
export function YearRangeSelector({ availableYears, startYear, endYear }: YearRangeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStartChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('start', value);
    // Ensure end >= start
    const newStart = parseInt(value, 10);
    if (newStart > endYear) {
      params.set('end', value);
    }
    router.push(`?${params.toString()}`);
  };

  const handleEndChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('end', value);
    // Ensure start <= end
    const newEnd = parseInt(value, 10);
    if (newEnd < startYear) {
      params.set('start', value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="start-year-select" className="text-sm font-medium">
          From
        </label>
        <Select value={String(startYear)} onValueChange={handleStartChange}>
          <SelectTrigger id="start-year-select" className="w-[100px]">
            <SelectValue placeholder="Start" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="end-year-select" className="text-sm font-medium">
          To
        </label>
        <Select value={String(endYear)} onValueChange={handleEndChange}>
          <SelectTrigger id="end-year-select" className="w-[100px]">
            <SelectValue placeholder="End" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
