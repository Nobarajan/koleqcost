"use client";

import { Gem, Moon, RefreshCw, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRate } from "@/lib/koleqcost/format";
import { cn } from "@/lib/utils";

type KoleqCostHeaderProps = {
  isDark: boolean;
  onToggleTheme: () => void;
  onRefresh: () => void;
  usdMyr: number;
  isLoadingRate?: boolean;
  isRefreshing?: boolean;
  fetchError?: string | null;
};

export function KoleqCostHeader({
  isDark,
  onToggleTheme,
  onRefresh,
  usdMyr,
  isLoadingRate = false,
  isRefreshing = false,
  fetchError = null,
}: KoleqCostHeaderProps) {
  return (
    <header className="space-y-2 border-b border-border/60 pb-4 sm:pb-5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Gem className="size-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              KoleqCost
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              Landed Cost & Profit Calculator for Collectors
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-2 sm:flex-col sm:items-end sm:justify-start">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-baseline gap-1.5 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5 text-xs sm:border-0 sm:bg-transparent sm:p-0">
              <span className="font-medium uppercase tracking-wide text-muted-foreground">
                USD/MYR
              </span>
              {isLoadingRate ? (
                <Skeleton className="h-4 w-12" />
              ) : (
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  {formatRate(usdMyr)}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-11 shrink-0 text-muted-foreground hover:text-foreground sm:size-7"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh exchange rate"
            >
              <RefreshCw
                className={cn(
                  "size-4 sm:size-3",
                  isRefreshing && "animate-spin",
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-11 shrink-0 sm:size-7"
              onClick={onToggleTheme}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDark ? (
                <Sun className="size-4 sm:size-3.5" />
              ) : (
                <Moon className="size-4 sm:size-3.5" />
              )}
            </Button>
          </div>
          {fetchError ? (
            <p className="w-full text-left text-[11px] leading-snug text-warning sm:max-w-xs sm:text-right sm:text-[10px]">
              {fetchError}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
