import { formatMYR, formatUSD } from "@/lib/koleqcost/format";
import {
  toneContainerClasses,
  toneTextClasses,
  type Tone,
} from "@/lib/koleqcost/tone";
import type { DisplayCurrency } from "@/lib/koleqcost/types";
import { cn } from "@/lib/utils";
import type { StatHighlight } from "@/components/koleqcost/result-stat";

export type CurrencyAmounts = {
  usd: number;
  myr: number;
};

type CurrencyStatProps = {
  label: string;
  amounts: CurrencyAmounts | null;
  displayCurrency: DisplayCurrency;
  highlight?: StatHighlight;
  size?: "default" | "hero";
  className?: string;
};

function resolveTone(highlight: StatHighlight): Tone {
  return highlight === "default" ? "neutral" : highlight;
}

function formatAmount(currency: Exclude<DisplayCurrency, "ALL">, value: number) {
  switch (currency) {
    case "USD":
      return formatUSD(value);
    case "MYR":
      return formatMYR(value);
  }
}

export function CurrencyStat({
  label,
  amounts,
  displayCurrency,
  highlight = "default",
  size = "default",
  className,
}: CurrencyStatProps) {
  const isHero = size === "hero";
  const tone = resolveTone(highlight);
  const hasTone = highlight !== "default";
  const valueClass = cn(
    "font-mono font-semibold tabular-nums tracking-tight break-words transition-all duration-200 ease-out",
    isHero ? "text-xl min-[380px]:text-2xl sm:text-3xl lg:text-4xl" : "text-base sm:text-sm lg:text-base",
    toneTextClasses[tone],
  );

  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border px-3.5 py-3 transition-all duration-200 ease-out sm:px-3 sm:py-2.5",
        isHero && "shadow-sm sm:hover:-translate-y-0.5 sm:hover:shadow-md",
        hasTone || isHero
          ? toneContainerClasses[tone]
          : "border-border/60 bg-muted/30",
        isHero && "sm:col-span-2",
        className,
      )}
    >
      <p
        className={cn(
          "truncate text-muted-foreground",
          isHero ? "text-xs font-medium uppercase tracking-wider" : "text-xs",
        )}
      >
        {label}
      </p>

      {amounts === null ? (
        <p className={cn("mt-1", valueClass)}>—</p>
      ) : displayCurrency === "ALL" ? (
        <div className="mt-1.5 space-y-1">
          {(["USD", "MYR"] as const).map((currency) => (
            <div
              key={currency}
              className="flex items-baseline justify-between gap-2 text-xs"
            >
              <span className="shrink-0 text-muted-foreground">{currency}</span>
              <span className={cn(valueClass, "text-right")}>
                {formatAmount(
                  currency,
                  amounts[currency.toLowerCase() as keyof CurrencyAmounts],
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className={cn("mt-1", valueClass)}>
          {formatAmount(
            displayCurrency,
            amounts[displayCurrency.toLowerCase() as keyof CurrencyAmounts],
          )}
        </p>
      )}
    </div>
  );
}
