'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Key rivals are shown prominently at the top
const KEY_RIVALS = ['Texas', 'Oklahoma State', 'Nebraska', 'Texas A&M', 'Kansas State'];

interface RivalSelectorProps {
  allOpponents: string[];
  selectedOpponent: string;
}

/**
 * Dropdown selector for choosing an opponent to view head-to-head stats.
 * Key rivals are shown at the top, followed by all other opponents.
 * Updates URL params on selection.
 */
export function RivalSelector({ allOpponents, selectedOpponent }: RivalSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Separate key rivals from other opponents
  const keyRivalsInData = KEY_RIVALS.filter((rival) =>
    allOpponents.some((opp) => opp.toLowerCase() === rival.toLowerCase())
  );
  const otherOpponents = allOpponents.filter(
    (opp) => !KEY_RIVALS.some((rival) => rival.toLowerCase() === opp.toLowerCase())
  );

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('opponent', value);
    router.push(`/rivals?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="opponent-select" className="text-sm font-medium">
        Opponent
      </label>
      <Select value={selectedOpponent} onValueChange={handleChange}>
        <SelectTrigger id="opponent-select" className="w-[200px]">
          <SelectValue placeholder="Select opponent" />
        </SelectTrigger>
        <SelectContent>
          {keyRivalsInData.length > 0 && (
            <SelectGroup>
              <SelectLabel>Key Rivals</SelectLabel>
              {keyRivalsInData.map((rival) => (
                <SelectItem key={rival} value={rival}>
                  {rival}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {otherOpponents.length > 0 && (
            <SelectGroup>
              <SelectLabel>All Opponents</SelectLabel>
              {otherOpponents.map((opponent) => (
                <SelectItem key={opponent} value={opponent}>
                  {opponent}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
