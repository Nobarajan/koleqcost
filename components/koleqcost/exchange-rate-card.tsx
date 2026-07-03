"use client";

import { useEffect, useState } from "react";
import { RefreshCw, SlidersHorizontal, ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatFxShortTimestamp,
  formatRate,
} from "@/lib/koleqcost/format";
import type { ExchangeRates } from "@/lib/koleqcost/types";
import { cn } from "@/lib/utils";

type ExchangeRateCardProps = {
  rates: ExchangeRates;
  isLoading: boolean;
  fetchError: string | null;
  manualOverride: boolean;
  onManualOverrideChange: (value: boolean) => void;
  onRefresh: () => void;
  onRateChange: (field: "usdMyr", value: string) => void;
};

function sourceBadge(source: ExchangeRates["source"]) {
  switch (source) {
    case "live":
      return (
        <Badge className="h-5 border-positive/30 bg-positive/10 px-1.5 text-[10px] font-medium text-positive">
          Live
        </Badge>
      );
    case "manual":
      return (
        <Badge className="h-5 border-purple-accent/30 bg-purple-accent/10 px-1.5 text-[10px] font-medium text-purple-accent">
          Manual
        </Badge>
      );
    case "fallback":
      return (
        <Badge className="h-5 border-warning/30 bg-warning/10 px-1.5 text-[10px] font-medium text-warning">
          Fallback
        </Badge>
      );
    case "cached":
      return (
        <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-medium">
          Cached
        </Badge>
      );
  }
}

function RateDisplay({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: number;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {isLoading ? (
        <Skeleton className="h-4 w-14" />
      ) : (
        <span className="font-mono text-sm font-semibold tabular-nums tracking-tight">
          {formatRate(value)}
        </span>
      )}
    </div>
  );
}

export function ExchangeRateCard({
  rates,
  isLoading,
  fetchError,
  manualOverride,
  onManualOverrideChange,
  onRefresh,
  onRateChange,
}: ExchangeRateCardProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftOverride, setDraftOverride] = useState(manualOverride);
  const [draftMyr, setDraftMyr] = useState(String(rates.usdMyr));

  useEffect(() => {
    if (!settingsOpen) return;
    setDraftOverride(manualOverride);
    setDraftMyr(String(rates.usdMyr));
  }, [settingsOpen, manualOverride, rates.usdMyr]);

  const handleSaveSettings = () => {
    if (draftOverride !== manualOverride) {
      onManualOverrideChange(draftOverride);
    }

    if (draftOverride) {
      onRateChange("usdMyr", draftMyr);
    }

    setSettingsOpen(false);
  };

  const updatedLabel =
    rates.lastUpdatedUtc && (rates.source === "live" || rates.source === "cached")
      ? formatFxShortTimestamp(rates.lastUpdatedUtc)
      : null;

  return (
    <div className="space-y-2">
      {fetchError ? (
        <p className="rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1.5 text-xs text-warning">
          {fetchError}
        </p>
      ) : null}

      <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 ring-1 ring-foreground/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <ArrowLeftRight className="size-4 shrink-0 text-info" />
          <RateDisplay
            label="USD/MYR"
            value={rates.usdMyr}
            isLoading={isLoading && !manualOverride}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:ml-auto">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {sourceBadge(rates.source)}
            {updatedLabel ? (
              <span className="hidden whitespace-nowrap sm:inline">
                · {updatedLabel}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onRefresh}
                    disabled={isLoading}
                    aria-label="Refresh exchange rates"
                  />
                }
              >
                <RefreshCw className={cn(isLoading && "animate-spin")} />
              </TooltipTrigger>
              <TooltipContent>Refresh rates</TooltipContent>
            </Tooltip>

            <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Exchange rate settings"
                  />
                }
              >
                <SlidersHorizontal />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 gap-3 p-3">
                <div className="flex items-center justify-between gap-3">
                  <PopoverTitle className="text-sm">
                    Manual rate override
                  </PopoverTitle>
                  <Switch
                    id="manual-override"
                    checked={draftOverride}
                    onCheckedChange={setDraftOverride}
                    aria-label="Manual rate override"
                  />
                </div>
                {draftOverride ? (
                  <div className="grid gap-2.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="usd-myr" className="text-xs">
                        USD / MYR
                      </Label>
                      <Input
                        id="usd-myr"
                        type="number"
                        min="0"
                        step="0.0001"
                        value={draftMyr}
                        onChange={(e) => setDraftMyr(e.target.value)}
                      />
                    </div>
                  </div>
                ) : null}
                <Button size="sm" className="w-full" onClick={handleSaveSettings}>
                  Save
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {updatedLabel ? (
        <p className="text-[11px] text-muted-foreground sm:hidden">
          {updatedLabel}
        </p>
      ) : null}
    </div>
  );
}
