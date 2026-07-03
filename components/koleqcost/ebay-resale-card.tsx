"use client";

import { useEffect, useState } from "react";
import { ChevronDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencyStat } from "@/components/koleqcost/currency-stat";
import { ResultStat, SectionLabel } from "@/components/koleqcost/result-stat";
import { formatPercent } from "@/lib/koleqcost/format";
import {
  readProfitDisplayCurrency,
  readResaleDisplayCurrency,
  writeProfitDisplayCurrency,
  writeResaleDisplayCurrency,
} from "@/lib/koleqcost/storage";
import type {
  DisplayCurrency,
  ExchangeRates,
  ProfitVerdict,
  ResaleInputs,
  ResaleResults,
  SellingMethod,
} from "@/lib/koleqcost/types";
import {
  DEFAULT_PROFIT_DISPLAY_CURRENCY,
  DEFAULT_RESALE_DISPLAY_CURRENCY,
  DISPLAY_CURRENCY_OPTIONS,
  SELLING_METHOD_OPTIONS,
} from "@/lib/koleqcost/types";
import { getVerdictTone } from "@/lib/koleqcost/tone";
import { cn } from "@/lib/utils";

type EbayResaleCardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputs: ResaleInputs;
  results: ResaleResults | null;
  rates: ExchangeRates;
  hasSellingPrice: boolean;
  onInputChange: <K extends keyof ResaleInputs>(
    field: K,
    value: ResaleInputs[K],
  ) => void;
};

function verdictBadge(verdict: ProfitVerdict) {
  switch (verdict) {
    case "loss":
      return <Badge variant="destructive">Loss</Badge>;
    case "thin":
      return (
        <Badge className="border-warning/30 bg-warning/10 text-warning">
          Thin margin
        </Badge>
      );
    case "okay":
      return (
        <Badge className="border-info/30 bg-info/10 text-info">
          Okay flip
        </Badge>
      );
    case "strong":
      return (
        <Badge className="border-positive/30 bg-positive/10 text-positive">
          Strong flip
        </Badge>
      );
    default:
      return null;
  }
}

function NumberField({
  id,
  label,
  value,
  placeholder,
  onChange,
  step = "0.01",
}: {
  id: string;
  label: string;
  value: number | string;
  placeholder?: string;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min="0"
        step={step}
        placeholder={placeholder}
        value={value === 0 ? "" : value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function CurrencySelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DisplayCurrency;
  onChange: (value: DisplayCurrency) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <Tabs
        value={value}
        onValueChange={(next) => onChange(next as DisplayCurrency)}
      >
        <TabsList className="h-8 w-full min-w-[220px] sm:w-auto">
          {DISPLAY_CURRENCY_OPTIONS.map((option) => (
            <TabsTrigger key={option} value={option} className="px-2 text-xs">
              {option === "ALL" ? "All" : option}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

export function EbayResaleCard({
  open,
  onOpenChange,
  inputs,
  results,
  rates,
  hasSellingPrice,
  onInputChange,
}: EbayResaleCardProps) {
  const isEbay = inputs.sellingMethod === "ebay";
  const isPhysical = !isEbay;
  const [resaleCurrency, setResaleCurrency] = useState<DisplayCurrency>(
    DEFAULT_RESALE_DISPLAY_CURRENCY,
  );
  const [profitCurrency, setProfitCurrency] = useState<DisplayCurrency>(
    DEFAULT_PROFIT_DISPLAY_CURRENCY,
  );
  const displayCurrency: DisplayCurrency = isPhysical ? "MYR" : resaleCurrency;
  const profitDisplayCurrency: DisplayCurrency = isPhysical
    ? "MYR"
    : profitCurrency;

  useEffect(() => {
    setResaleCurrency(readResaleDisplayCurrency());
    setProfitCurrency(readProfitDisplayCurrency());
  }, []);

  const handleSellingMethodChange = (method: SellingMethod) => {
    onInputChange("sellingMethod", method);
    if (method === "physical") {
      setResaleCurrency("MYR");
      writeResaleDisplayCurrency("MYR");
    }
  };

  const handleResaleCurrencyChange = (value: DisplayCurrency) => {
    setResaleCurrency(value);
    writeResaleDisplayCurrency(value);
  };

  const handleProfitCurrencyChange = (value: DisplayCurrency) => {
    setProfitCurrency(value);
    writeProfitDisplayCurrency(value);
  };

  const profitHighlight =
    results === null
      ? "default"
      : results.profitUsd < 0
        ? "negative"
        : "positive";

  const conservativeHighlight =
    results === null
      ? "default"
      : results.profitAfterPercentUsd < 0
        ? "negative"
        : "positive";

  const resalePct = inputs.resaleMultiplierPercent;

  const sellingPriceAmounts = isEbay
    ? {
        usd: inputs.soldPriceUsd,
        myr: inputs.soldPriceUsd * rates.usdMyr,
      }
    : {
        usd: inputs.localSellingPriceMyr / rates.usdMyr,
        myr: inputs.localSellingPriceMyr,
      };

  const breakEvenAmounts =
    results?.breakEvenSellPriceUsd !== null && results
      ? {
          usd: results.breakEvenSellPriceUsd ?? 0,
          myr: results.breakEvenSellPriceMyr ?? 0,
        }
      : null;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <Card
        size="sm"
        className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="cursor-pointer transition-colors hover:bg-muted/30">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <TrendingUp className="size-4 text-info" />
                  Resale calculator
                  {results?.verdict && verdictBadge(results.verdict)}
                </CardTitle>
                <CardDescription>
                  Estimate net received, profit, ROI, and break-even price.
                </CardDescription>
              </div>
              <ChevronDown
                className={cn(
                  "mt-1 size-5 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Selling method
              </p>
              <Tabs
                value={inputs.sellingMethod}
                onValueChange={(next) =>
                  handleSellingMethodChange(next as SellingMethod)
                }
              >
                <TabsList className="h-9 w-full sm:w-auto">
                  {SELLING_METHOD_OPTIONS.map((option) => (
                    <TabsTrigger
                      key={option.value}
                      value={option.value}
                      className={cn(
                        "px-3 text-xs sm:text-sm",
                        option.value === "ebay" &&
                          "data-active:bg-info/10 data-active:text-info dark:data-active:bg-info/8",
                        option.value === "physical" &&
                          "data-active:bg-orange-accent/10 data-active:text-orange-accent dark:data-active:bg-orange-accent/8",
                      )}
                    >
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <SectionLabel>Inputs</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {isEbay ? (
                <>
                  <NumberField
                    id="sold-price"
                    label="Sold price (USD)"
                    value={inputs.soldPriceUsd}
                    placeholder="400"
                    onChange={(v) =>
                      onInputChange("soldPriceUsd", parseFloat(v) || 0)
                    }
                  />
                  <NumberField
                    id="buyer-shipping-charged"
                    label="Buyer shipping charged (USD)"
                    value={inputs.buyerShippingChargedUsd}
                    onChange={(v) =>
                      onInputChange(
                        "buyerShippingChargedUsd",
                        parseFloat(v) || 0,
                      )
                    }
                  />
                  <NumberField
                    id="shipping-cost"
                    label="Shipping cost to buyer (USD)"
                    value={inputs.shippingCostToBuyerUsd}
                    onChange={(v) =>
                      onInputChange(
                        "shippingCostToBuyerUsd",
                        parseFloat(v) || 0,
                      )
                    }
                  />
                  <NumberField
                    id="ebay-fee"
                    label="eBay final value fee (%)"
                    value={inputs.ebayFeePct}
                    onChange={(v) =>
                      onInputChange("ebayFeePct", parseFloat(v) || 0)
                    }
                  />
                  <NumberField
                    id="intl-fee"
                    label="International fee (%)"
                    value={inputs.internationalFeePct}
                    onChange={(v) =>
                      onInputChange("internationalFeePct", parseFloat(v) || 0)
                    }
                  />
                  <NumberField
                    id="promoted-fee"
                    label="Promoted listing fee (%)"
                    value={inputs.promotedFeePct}
                    onChange={(v) =>
                      onInputChange("promotedFeePct", parseFloat(v) || 0)
                    }
                  />
                  <NumberField
                    id="fixed-fee"
                    label="Fixed order fee (USD)"
                    value={inputs.fixedOrderFeeUsd}
                    onChange={(v) =>
                      onInputChange("fixedOrderFeeUsd", parseFloat(v) || 0)
                    }
                  />
                  <NumberField
                    id="other-cost"
                    label="Other cost (USD)"
                    value={inputs.otherCostUsd}
                    onChange={(v) =>
                      onInputChange("otherCostUsd", parseFloat(v) || 0)
                    }
                  />
                </>
              ) : (
                <>
                  <NumberField
                    id="local-selling-price"
                    label="Local selling price (RM)"
                    value={inputs.localSellingPriceMyr}
                    placeholder="1500"
                    step="1"
                    onChange={(v) =>
                      onInputChange("localSellingPriceMyr", parseFloat(v) || 0)
                    }
                  />
                  <NumberField
                    id="resale-multiplier-physical"
                    label="Resale %"
                    value={inputs.resaleMultiplierPercent}
                    placeholder="80"
                    step="1"
                    onChange={(v) =>
                      onInputChange("resaleMultiplierPercent", parseFloat(v) || 0)
                    }
                  />
                  <NumberField
                    id="platform-meetup-fee"
                    label="Platform/meetup fee (RM)"
                    value={inputs.platformMeetupFeeMyr}
                    step="1"
                    onChange={(v) =>
                      onInputChange("platformMeetupFeeMyr", parseFloat(v) || 0)
                    }
                  />
                  <NumberField
                    id="delivery-transport-cost"
                    label="Delivery/transport cost (RM)"
                    value={inputs.deliveryTransportCostMyr}
                    step="1"
                    onChange={(v) =>
                      onInputChange(
                        "deliveryTransportCostMyr",
                        parseFloat(v) || 0,
                      )
                    }
                  />
                </>
              )}
              {isEbay ? (
                <NumberField
                  id="resale-multiplier"
                  label="Resale %"
                  value={inputs.resaleMultiplierPercent}
                  placeholder="80"
                  step="1"
                  onChange={(v) =>
                    onInputChange("resaleMultiplierPercent", parseFloat(v) || 0)
                  }
                />
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <SectionLabel>Results</SectionLabel>
              {isEbay ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <CurrencySelector
                    label="Display currency"
                    value={resaleCurrency}
                    onChange={handleResaleCurrencyChange}
                  />
                  <CurrencySelector
                    label="Profit display"
                    value={profitCurrency}
                    onChange={handleProfitCurrencyChange}
                  />
                </div>
              ) : null}
            </div>

            {!hasSellingPrice ? (
              <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                Enter {isEbay ? "sold price" : "local selling price"} to
                calculate profit.
              </div>
            ) : results ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <CurrencyStat
                    label={isEbay ? "Sold price" : "Local selling price"}
                    amounts={sellingPriceAmounts}
                    displayCurrency={displayCurrency}
                  />
                  <CurrencyStat
                    label={`After ${resalePct}%`}
                    amounts={{
                      usd: results.resaleAfterPercentUsd,
                      myr: results.resaleAfterPercentMyr,
                    }}
                    displayCurrency={displayCurrency}
                  />
                  {isEbay ? (
                    <CurrencyStat
                      label="Estimated eBay fees"
                      amounts={{
                        usd: results.totalFeesUsd,
                        myr: results.totalFeesMyr,
                      }}
                      displayCurrency={displayCurrency}
                    />
                  ) : (
                    <>
                      <CurrencyStat
                        label="Platform/meetup fee"
                        amounts={{
                          usd: results.platformMeetupFeeUsd,
                          myr: results.platformMeetupFeeMyr,
                        }}
                        displayCurrency={displayCurrency}
                      />
                      <CurrencyStat
                        label="Delivery/transport cost"
                        amounts={{
                          usd: results.deliveryTransportCostUsd,
                          myr: results.deliveryTransportCostMyr,
                        }}
                        displayCurrency={displayCurrency}
                      />
                    </>
                  )}
                  <CurrencyStat
                    label="Net received"
                    amounts={{
                      usd: results.netReceivedUsd,
                      myr: results.netReceivedMyr,
                    }}
                    displayCurrency={profitDisplayCurrency}
                  />
                  <CurrencyStat
                    label="Profit"
                    amounts={{
                      usd: results.profitUsd,
                      myr: results.profitMyr,
                    }}
                    displayCurrency={profitDisplayCurrency}
                    highlight={profitHighlight}
                    size="hero"
                  />
                  <CurrencyStat
                    label={`Profit after ${resalePct}%`}
                    amounts={{
                      usd: results.profitAfterPercentUsd,
                      myr: results.profitAfterPercentMyr,
                    }}
                    displayCurrency={profitDisplayCurrency}
                    highlight={conservativeHighlight}
                    size="hero"
                  />
                  <ResultStat
                    label="ROI"
                    value={formatPercent(results.roiPct)}
                    highlight={getVerdictTone(results.verdict)}
                  />
                  <ResultStat
                    label="Margin"
                    value={formatPercent(results.marginPct)}
                    highlight={getVerdictTone(results.verdict)}
                  />
                  <CurrencyStat
                    label={
                      isEbay ? "Break-even price" : "Break-even local price"
                    }
                    amounts={breakEvenAmounts}
                    displayCurrency={displayCurrency}
                    highlight="info"
                    size="hero"
                    className="sm:col-span-2"
                  />
                </div>
              </div>
            ) : null}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
