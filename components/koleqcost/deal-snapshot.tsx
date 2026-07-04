"use client";

import {
  Gauge,
  Info,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMYR, formatPercent } from "@/lib/koleqcost/format";
import {
  getAmountTone,
  getVerdictTone,
  toneBadgeClasses,
  toneContainerClasses,
  toneIconClasses,
  toneTextClasses,
  type Tone,
} from "@/lib/koleqcost/tone";
import type { BuyingResults, ResaleResults } from "@/lib/koleqcost/types";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type DealSnapshotProps = {
  buyingResults: BuyingResults | null;
  resaleResults: ResaleResults | null;
  hasItemPrice: boolean;
  hasSellingPrice: boolean;
  resaleMultiplierPercent: number;
};

type SnapshotCardProps = {
  label: string;
  value: string;
  subtitle: string;
  tone: Tone;
  icon: LucideIcon;
  featured?: boolean;
};

function SnapshotCard({
  label,
  value,
  subtitle,
  tone,
  icon: Icon,
  featured = false,
}: SnapshotCardProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border px-3.5 py-3.5 shadow-sm transition-all duration-200 ease-out sm:py-3 sm:hover:-translate-y-0.5 sm:hover:shadow-md",
        toneContainerClasses[tone],
        featured && "ring-1 ring-primary/20",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-[10px] font-semibold uppercase leading-snug tracking-[0.12em] text-muted-foreground sm:tracking-[0.14em]">
          {label}
        </p>
        <Icon className={cn("size-4 shrink-0", toneIconClasses[tone])} />
      </div>
      <p
        className={cn(
          "mt-2 overflow-x-auto font-mono font-semibold tabular-nums tracking-tight whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          featured
            ? "text-xl min-[420px]:text-2xl sm:text-3xl lg:text-4xl"
            : "text-base min-[420px]:text-lg sm:text-2xl lg:text-3xl",
          toneTextClasses[tone],
        )}
      >
        {value}
      </p>
      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:truncate sm:leading-normal">
        {subtitle}
      </p>
    </div>
  );
}

export function DealSnapshot({
  buyingResults,
  resaleResults,
  hasItemPrice,
  hasSellingPrice,
  resaleMultiplierPercent,
}: DealSnapshotProps) {
  const showLandedCost = hasItemPrice && buyingResults !== null;
  const showResaleMetrics =
    hasSellingPrice && buyingResults !== null && resaleResults !== null;

  const profitTone = showResaleMetrics
    ? getAmountTone(resaleResults.profitMyr)
    : "neutral";
  const afterResaleTone = showResaleMetrics
    ? getAmountTone(resaleResults.profitAfterPercentMyr)
    : "neutral";
  const roiTone = showResaleMetrics
    ? getVerdictTone(resaleResults.verdict)
    : "neutral";

  const ProfitIcon =
    showResaleMetrics && resaleResults.profitMyr < 0
      ? TrendingDown
      : TrendingUp;

  const showHelper = !showLandedCost || !showResaleMetrics;

  return (
    <Card
      size="sm"
      className="shadow-sm ring-1 ring-border/60 transition-all duration-200 sm:hover:shadow-md"
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold tracking-tight">
            Deal Snapshot
          </CardTitle>
          {showResaleMetrics && resaleResults.verdict ? (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                toneBadgeClasses[
                  roiTone === "positive"
                    ? "positive"
                    : roiTone === "warning"
                      ? "warning"
                      : roiTone === "negative"
                        ? "negative"
                        : "neutral"
                ],
              )}
            >
              {resaleResults.verdict === "loss"
                ? "Loss"
                : resaleResults.verdict === "thin"
                  ? "Thin margin"
                  : resaleResults.verdict === "okay"
                    ? "Okay flip"
                    : "Strong flip"}
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="grid min-w-0 grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          <SnapshotCard
            label="Total Landed Cost"
            value={
              showLandedCost ? formatMYR(buyingResults.landedCostMyr) : "—"
            }
            subtitle="Real cost after tax + admin fees"
            tone="purple"
            icon={Wallet}
          />
          <SnapshotCard
            label="Profit"
            value={
              showResaleMetrics ? formatMYR(resaleResults.profitMyr) : "—"
            }
            subtitle="Based on current resale input"
            tone={profitTone}
            icon={ProfitIcon}
            featured
          />
          <SnapshotCard
            label={`After ${resaleMultiplierPercent}%`}
            value={
              showResaleMetrics
                ? formatMYR(resaleResults.profitAfterPercentMyr)
                : "—"
            }
            subtitle="Conservative cash-out view"
            tone={afterResaleTone}
            icon={PiggyBank}
          />
          <SnapshotCard
            label="ROI"
            value={
              showResaleMetrics ? formatPercent(resaleResults.roiPct) : "—"
            }
            subtitle="Return on landed cost"
            tone={roiTone}
            icon={Gauge}
          />
        </div>

        {showHelper ? (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            Enter buying and resale details to see snapshot.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
