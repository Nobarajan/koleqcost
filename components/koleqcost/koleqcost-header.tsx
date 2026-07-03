"use client";

import { Gem, Info, Moon, RefreshCw, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    <header className="space-y-3 border-b border-border/60 pb-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Gem className="size-4" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            KoleqCost
          </h1>
          <Badge className="border-warning/30 bg-warning/10 text-[10px] uppercase tracking-wide text-warning">
            Estimate only
          </Badge>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 text-xs">
            <div className="flex items-baseline gap-1.5">
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
              className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh exchange rate"
            >
              <RefreshCw
                className={cn("size-3", isRefreshing && "animate-spin")}
              />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleTheme}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
          >
            {isDark ? <Sun /> : <Moon />}
          </Button>
          </div>
          {fetchError ? (
            <p className="max-w-[220px] text-right text-[10px] leading-snug text-warning sm:max-w-xs">
              {fetchError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium tracking-tight text-foreground sm:text-base">
          Know your real cost before you buy.
        </p>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Calculate landed cost, resale price, fees, profit, ROI, and
          break-even value for collectibles.
        </p>
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground/90">
          <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70" />
          <span>
            Estimates only — customs, courier fees, exchange rates, marketplace
            fees, and taxes may vary. Always confirm final costs before you
            commit.
          </span>
        </p>
      </div>
    </header>
  );
}
