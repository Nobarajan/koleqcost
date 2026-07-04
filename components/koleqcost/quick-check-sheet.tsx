"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  computeQuickCheck,
  formatQuickCheckAmount,
  formatQuickCheckRange,
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
  helper: string;
  tone: Tone;
};

function buildRangeRows(
  result: NonNullable<ReturnType<typeof computeQuickCheck>>,
): RangeRow[] {
  return [
    {
      label: "Great Deal",
      percentLabel: "≤70%",
      rangeText: formatQuickCheckRange(null, result.greatDealMax),
      helper: "Buy if condition checks out",
      tone: "gold",
    },
    {
      label: "Smart Buy",
      percentLabel: "71–80%",
      rangeText: formatQuickCheckRange(result.smartBuyMin, result.smartBuyMax),
      helper: "Good range",
      tone: "positive",
    },
    {
      label: "Fair Price",
      percentLabel: "81–85%",
      rangeText: formatQuickCheckRange(result.fairMin, result.fairMax),
      helper: "Okay, but not a bargain",
      tone: "info",
    },
    {
      label: "Slightly High",
      percentLabel: "86–90%",
      rangeText: formatQuickCheckRange(
        result.slightlyHighMin,
        result.slightlyHighMax,
      ),
      helper: "Negotiate first",
      tone: "warning",
    },
    {
      label: "Walk Away",
      percentLabel: ">90%",
      rangeText: formatQuickCheckRange(result.walkAwayThreshold, null),
      helper: "Unless rare or very clean",
      tone: "negative",
    },
  ];
}

export function QuickCheckTrigger() {
  const [open, setOpen] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const marketPrice = useMemo(() => {
    const parsed = parseFloat(priceInput);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [priceInput]);

  const result = useMemo(() => computeQuickCheck(marketPrice), [marketPrice]);

  const rangeRows = useMemo(
    () => (result ? buildRangeRows(result) : []),
    [result],
  );

  useEffect(() => {
    if (!open) {
      setPriceInput("");
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
        className="size-11 shrink-0 text-muted-foreground hover:text-foreground sm:size-9"
        onClick={() => setOpen(true)}
        aria-label="Open quick price checker"
      >
        <Calculator className="size-4 sm:size-3.5" />
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
              Enter last sold price. Know what you should pay.
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="quick-check-price"
                  className="text-xs text-muted-foreground"
                >
                  Market price / last sold
                </Label>
                <Input
                  ref={inputRef}
                  id="quick-check-price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
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
                    ? "border-primary/30 bg-gradient-to-b from-primary/12 to-primary/[0.03]"
                    : "border-border/60 bg-muted/20",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Safe Buy Range
                </p>
                <p
                  className={cn(
                    "mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl",
                    result ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {result
                    ? formatQuickCheckRange(result.safeBuyMin, result.safeBuyMax)
                    : "—"}
                </p>
                {result ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Best offer: {formatQuickCheckAmount(result.safeBuyMin)} or
                    less
                  </p>
                ) : null}
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
                        <div className="flex items-baseline gap-1.5">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              toneTextClasses[row.tone],
                            )}
                          >
                            {row.label}
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            {row.percentLabel}
                          </span>
                        </div>
                        <p className="text-[11px] italic text-muted-foreground">
                          {row.helper}
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
                Guidance only — always check condition, photos, and seller
                reputation before buying.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
