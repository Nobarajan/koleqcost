"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS, type SortOption } from "@/lib/koleqcost/types";

type HistoryToolbarProps = {
  search: string;
  sort: SortOption;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
};

export function HistoryToolbar({
  search,
  sort,
  onSearchChange,
  onSortChange,
}: HistoryToolbarProps) {
  const sortLabel =
    SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Sort by";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1 sm:max-w-56">
        <Label htmlFor="history-search" className="sr-only">
          Search history
        </Label>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground sm:left-2.5 sm:size-3.5" />
        <Input
          id="history-search"
          type="search"
          placeholder="Search item or notes…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-11 pl-8 text-base sm:h-8 sm:pl-7 sm:text-sm"
        />
      </div>

      <Label htmlFor="history-sort" className="sr-only">
        Sort by
      </Label>
      <Select
        value={sort}
        onValueChange={(value) => onSortChange(value as SortOption)}
      >
        <SelectTrigger
          id="history-sort"
          className="h-11 w-full bg-background text-base sm:h-8 sm:w-40 sm:text-sm"
        >
          <SelectValue placeholder="Sort by">{sortLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
