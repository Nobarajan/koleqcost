"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  computeQuickCheck,
  formatQuickCheckAmount,
  formatQuickCheckRange,
  QUICK_CHECK_CURRENCIES,
  type QuickCheckCurrency,
} from "@/lib/koleqcost/quick-check";
import {
  toneContainerClasses,
  toneTextClasses,
  type Tone,
} from "@/lib/koleqcost/tone";
import { cn } from "@/lib/utils";

type RangeRow = {
  label: string;
  percentLabel: string;
  rangeText: string;
  tone: Tone;
};

function buildRangeRows(
  result: NonNullable<ReturnType<typeof computeQuickCheck>>,
  currency: QuickCheckCurrency,
): RangeRow[] {
  return [
    {
      label: "Steal",
      percentLabel: "≤70%",
      rangeText: formatQuickCheckRange(null, result.stealMax, currency),
      tone: "gold",
    },
    {
      label: "Good Buy",
      percentLabel: "71–80%",
      rangeText: formatQuickCheckRange(
        result.goodBuyMin,
        result.goodBuyMax,
        currency,
      ),
      tone: "positive",
    },
    {
      label: "Fair",
      percentLabel: "81–85%",
      rangeText: formatQuickCheckRange(
        result.fairMin,
        result.fairMax,
        currency,
      ),
      tone: "info",
    },
    {
      label: "Risky",
      percentLabel: "86–90%",
      rangeText: formatQuickCheckRange(
        result.riskyMin,
        result.riskyMax,
        currency,
      ),
      tone: "warning",
    },
    {
      label: "Pass",
      percentLabel: ">90%",
      rangeText: formatQuickCheckRange(result.passMin, null, currency),
      tone: "negative",
    },
  ];
}

export function QuickCheckTrigger() {
  const [open, setOpen] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [currency, setCurrency] = useState<QuickCheckCurrency>("RM");
  const inputRef = useRef<HTMLInputElement>(null);

  const marketPrice = useMemo(() => {
    const parsed = parseFloat(priceInput);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [priceInput]);

  const result = useMemo(
    () => computeQuickCheck(marketPrice, currency),
    [marketPrice, currency],
  );

  const rangeRows = useMemo(
    () => (result ? buildRangeRows(result, currency) : []),
    [result, currency],
  );

  useEffect(() => {
    if (!open) {
      setPriceInput("");
      setCurrency("RM");
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="relative size-11 shrink-0 text-muted-foreground hover:text-foreground sm:size-9"
        onClick={() => setOpen(true)}
        aria-label="Open quick percentage calculator"
      >
        <Calculator className="size-4 sm:size-3.5" />
        <span className="absolute -top-1 -right-1 rounded-full bg-primary px-1 text-[8px] font-bold leading-none text-primary-foreground">
          80%
        </span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-t-2xl p-0"
        >
          <SheetHeader className="shrink-0 border-b border-border/60 px-4 py-4 pr-12">
            <SheetTitle className="text-base font-semibold">
              Quick Calculator
            </SheetTitle>
            <SheetDescription>
              Enter market price. Know your safe buy range instantly.
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Currency
                </p>
                <Tabs
                  value={currency}
                  onValueChange={(next) =>
                    setCurrency(next as QuickCheckCurrency)
                  }
                >
                  <TabsList className="h-11 w-full min-w-0">
                    {QUICK_CHECK_CURRENCIES.map((option) => (
                      <TabsTrigger
                        key={option}
                        value={option}
                        className="min-h-10 flex-1 text-xs"
                      >
                        {option}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="quick-check-price"
                  className="text-xs text-muted-foreground"
                >
                  Market price / last sold price
                </Label>
                <Input
                  ref={inputRef}
                  id="quick-check-price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step={currency === "JPY" ? "1" : "0.01"}
                  placeholder="0.00"
                  value={priceInput}
                  onChange={(event) => setPriceInput(event.target.value)}
                  className="h-14 text-center font-mono text-2xl font-semibold tabular-nums sm:h-12 sm:text-xl"
                />
              </div>

              <div
                className={cn(
                  "rounded-xl border px-4 py-4 text-center shadow-sm",
                  result
                    ? toneContainerClasses.positive
                    : "border-border/60 bg-muted/20",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  80% Target
                </p>
                <p
                  className={cn(
                    "mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl",
                    result ? toneTextClasses.positive : "text-muted-foreground",
                  )}
                >
                  {result
                    ? formatQuickCheckAmount(result.target, currency)
                    : "—"}
                </p>
              </div>

              {result ? (
                <div className="space-y-2">
                  {rangeRows.map((row) => (
                    <div
                      key={row.label}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5",
                        toneContainerClasses[row.tone],
                      )}
                    >
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            toneTextClasses[row.tone],
                          )}
                        >
                          {row.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {row.percentLabel}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "shrink-0 text-right font-mono text-sm font-semibold tabular-nums",
                          toneTextClasses[row.tone],
                        )}
                      >
                        {row.rangeText}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                At the 80% target or below, this is safer. Above 90%, margin is
                too thin.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
