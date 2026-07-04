"use client";

import { useState } from "react";
import { Calculator, ChevronDown, Landmark, Truck } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumberField } from "@/components/koleqcost/number-field";
import { ResultStat, SectionLabel } from "@/components/koleqcost/result-stat";
import { formatMYR, formatUSD } from "@/lib/koleqcost/format";
import type {
  BuyingInputs,
  BuyingResults,
  TaxBasis,
  TaxPreset,
} from "@/lib/koleqcost/types";
import { TAX_BASIS_LABELS, TAX_PRESET_OPTIONS, TAX_PRESET_SHORT_LABELS, TAX_PRESET_SUMMARY_LABELS } from "@/lib/koleqcost/types";
import { toneBadgeClasses } from "@/lib/koleqcost/tone";
import { cn } from "@/lib/utils";

type BuyingCostCardProps = {
  inputs: BuyingInputs;
  results: BuyingResults | null;
  hasItemPrice: boolean;
  onInputChange: <K extends keyof BuyingInputs>(
    field: K,
    value: BuyingInputs[K],
  ) => void;
};

function formatDutyValue(value: number, isManual: boolean): string {
  return isManual ? "—" : formatMYR(value);
}

export function TaxPresetBadge({ preset }: { preset: TaxPreset }) {
  switch (preset) {
    case "courier":
      return (
        <Badge className={toneBadgeClasses.info}>Courier</Badge>
      );
    case "traveller":
      return (
        <Badge className={toneBadgeClasses.purple}>Traveller</Badge>
      );
    case "manual":
      return (
        <Badge className={toneBadgeClasses.purple}>Manual</Badge>
      );
    case "custom":
      return (
        <Badge variant="outline" className={toneBadgeClasses.neutral}>
          Custom Rates
        </Badge>
      );
  }
}

function TaxRatesSummaryChip({
  importDutyPct,
  salesTaxPct,
  exciseDutyPct,
}: {
  importDutyPct: number;
  salesTaxPct: number;
  exciseDutyPct: number;
}) {
  return (
    <Badge
      variant="secondary"
      className="border-border/60 bg-background/80 px-2.5 py-1.5 font-normal whitespace-normal text-muted-foreground"
    >
      {importDutyPct}% duty + {salesTaxPct}% sales + {exciseDutyPct}% excise
    </Badge>
  );
}

export function BuyingCostCard({
  inputs,
  results,
  hasItemPrice,
  onInputChange,
}: BuyingCostCardProps) {
  const isManual = inputs.taxPreset === "manual";
  const isCustom = inputs.taxPreset === "custom";
  const isPresetRates =
    inputs.taxPreset === "courier" || inputs.taxPreset === "traveller";
  const [taxPresetOpen, setTaxPresetOpen] = useState(false);
  const [courierFeesOpen, setCourierFeesOpen] = useState(false);
  const selectedPreset = TAX_PRESET_OPTIONS.find(
    (option) => option.value === inputs.taxPreset,
  );

  const handleTaxPresetChange = (preset: TaxPreset) => {
    onInputChange("taxPreset", preset);

    if (preset === "courier") {
      onInputChange("importDutyPct", 10);
      onInputChange("salesTaxPct", 10);
      onInputChange("exciseDutyPct", 10);
      onInputChange("taxBasis", "full_cif");
      return;
    }

    if (preset === "traveller") {
      onInputChange("importDutyPct", 10);
      onInputChange("salesTaxPct", 10);
      onInputChange("exciseDutyPct", 10);
      onInputChange("exemptionMyr", 1000);
      onInputChange("taxBasis", "above_exemption");
    }
  };

  const courierFeesTotal =
    inputs.agentHandlingFeeMyr +
    inputs.ediSmkFeeMyr +
    inputs.otherCourierFeeMyr;

  return (
    <Card
      size="sm"
      className="shadow-sm ring-1 ring-border/60 transition-all duration-200 sm:hover:-translate-y-0.5 sm:hover:shadow-md"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="size-4 text-primary" />
          Buying cost calculator
        </CardTitle>
        <CardDescription>
          Estimate CIF value, import taxes, and total landed cost in Malaysia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SectionLabel>Inputs</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            id="item-price"
            label="Item price (USD)"
            value={inputs.itemPriceUsd}
            placeholder="185"
            onChange={(v) =>
              onInputChange("itemPriceUsd", parseFloat(v) || 0)
            }
          />
          <NumberField
            id="postage"
            label="Postage fee (USD)"
            value={inputs.postageUsd}
            placeholder="19.67"
            onChange={(v) => onInputChange("postageUsd", parseFloat(v) || 0)}
          />
          <NumberField
            id="quantity"
            label="Quantity"
            value={inputs.quantity}
            placeholder="1"
            step="1"
            onChange={(v) =>
              onInputChange("quantity", Math.max(parseInt(v, 10) || 1, 1))
            }
          />
          <NumberField
            id="others-cost"
            label="Other cost (RM)"
            value={inputs.othersCostMyr}
            placeholder="e.g. grading, repair"
            step="1"
            onChange={(v) =>
              onInputChange("othersCostMyr", parseFloat(v) || 0)
            }
          />
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="note" className="text-xs text-muted-foreground">
              Item name
            </Label>
            <Input
              id="note"
              placeholder="e.g. PSA 10 Charizard"
              value={inputs.note}
              onChange={(e) => onInputChange("note", e.target.value)}
              className="h-11 sm:h-9"
            />
          </div>
        </div>

        <Collapsible open={taxPresetOpen} onOpenChange={setTaxPresetOpen}>
          <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/20">
            <CollapsibleTrigger className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-3 text-left transition-colors hover:bg-muted/40 sm:min-h-0 sm:py-2.5">
              <p className="flex min-w-0 flex-1 flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:flex-row sm:items-center sm:gap-1.5">
                <span className="flex items-center gap-1.5">
                  <Landmark className="size-3.5 shrink-0 text-warning" />
                  Tax preset
                </span>
                {selectedPreset ? (
                  <span className="truncate normal-case tracking-normal text-foreground">
                    ({TAX_PRESET_SUMMARY_LABELS[inputs.taxPreset]})
                  </span>
                ) : null}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <TaxPresetBadge preset={inputs.taxPreset} />
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    taxPresetOpen && "rotate-180",
                  )}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3 border-t border-border/60 px-3 py-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tax-preset" className="text-xs text-muted-foreground">
                    Tax preset
                  </Label>
                  <Select
                    value={inputs.taxPreset}
                    onValueChange={(value) =>
                      handleTaxPresetChange(value as TaxPreset)
                    }
                  >
                    <SelectTrigger id="tax-preset" className="h-11 w-full bg-background sm:h-9">
                      <SelectValue placeholder="Select tax preset">
                        {TAX_PRESET_SHORT_LABELS[inputs.taxPreset]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_PRESET_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPreset ? (
                    <p className="text-[11px] text-muted-foreground">
                      {selectedPreset.description}
                    </p>
                  ) : null}
                </div>

                {isPresetRates ? (
                  <TaxRatesSummaryChip
                    importDutyPct={inputs.importDutyPct}
                    salesTaxPct={inputs.salesTaxPct}
                    exciseDutyPct={inputs.exciseDutyPct}
                  />
                ) : null}

                {isManual ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <NumberField
                      id="manual-customs"
                      label="Actual customs duty/tax paid (RM)"
                      value={inputs.manualCustomsChargeMyr}
                      step="1"
                      onChange={(v) =>
                        onInputChange("manualCustomsChargeMyr", parseFloat(v) || 0)
                      }
                    />
                  </div>
                ) : null}

                {isCustom ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <NumberField
                      id="import-duty"
                      label="Import duty (%)"
                      value={inputs.importDutyPct}
                      onChange={(v) =>
                        onInputChange("importDutyPct", parseFloat(v) || 0)
                      }
                    />
                    <NumberField
                      id="sales-tax"
                      label="Sales tax (%)"
                      value={inputs.salesTaxPct}
                      onChange={(v) =>
                        onInputChange("salesTaxPct", parseFloat(v) || 0)
                      }
                    />
                    <NumberField
                      id="excise-duty"
                      label="Excise duty (%)"
                      value={inputs.exciseDutyPct}
                      onChange={(v) =>
                        onInputChange("exciseDutyPct", parseFloat(v) || 0)
                      }
                    />
                    <div className="space-y-1.5">
                      <Label htmlFor="tax-basis" className="text-xs text-muted-foreground">
                        Tax basis
                      </Label>
                      <Select
                        value={inputs.taxBasis}
                        onValueChange={(value) =>
                          onInputChange("taxBasis", value as TaxBasis)
                        }
                      >
                        <SelectTrigger id="tax-basis" className="h-11 w-full bg-background sm:h-9">
                          <SelectValue placeholder="Select tax basis" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(TAX_BASIS_LABELS) as TaxBasis[]).map(
                            (basis) => (
                              <SelectItem key={basis} value={basis}>
                                {TAX_BASIS_LABELS[basis]}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {inputs.taxBasis === "above_exemption" ? (
                      <NumberField
                        id="exemption"
                        label="Exemption amount (RM)"
                        value={inputs.exemptionMyr}
                        step="1"
                        onChange={(v) =>
                          onInputChange("exemptionMyr", parseFloat(v) || 0)
                        }
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        <Collapsible open={courierFeesOpen} onOpenChange={setCourierFeesOpen}>
          <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/20">
            <CollapsibleTrigger className="flex min-h-11 w-full items-center justify-between px-3 py-3 text-left transition-colors hover:bg-muted/40 sm:min-h-0 sm:py-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Truck className="size-3.5 text-orange-accent" />
                Courier/admin fees
                {courierFeesTotal > 0 && (
                  <span className="ml-2 normal-case tracking-normal text-foreground">
                    ({formatMYR(courierFeesTotal)})
                  </span>
                )}
              </p>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  courierFeesOpen && "rotate-180",
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid gap-3 border-t border-border/60 px-3 py-3 sm:grid-cols-2 lg:grid-cols-3">
                <NumberField
                  id="agent-handling"
                  label="Agent handling fee (RM)"
                  value={inputs.agentHandlingFeeMyr}
                  step="1"
                  placeholder="30"
                  onChange={(v) =>
                    onInputChange("agentHandlingFeeMyr", parseFloat(v) || 0)
                  }
                />
                <NumberField
                  id="edi-smk"
                  label="EDI / SMK fee (RM)"
                  value={inputs.ediSmkFeeMyr}
                  step="1"
                  placeholder="18"
                  onChange={(v) =>
                    onInputChange("ediSmkFeeMyr", parseFloat(v) || 0)
                  }
                />
                <NumberField
                  id="other-courier"
                  label="Other courier/admin fee (RM)"
                  value={inputs.otherCourierFeeMyr}
                  step="1"
                  onChange={(v) =>
                    onInputChange("otherCourierFeeMyr", parseFloat(v) || 0)
                  }
                />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        <SectionLabel>Results</SectionLabel>

        {!hasItemPrice ? (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            Enter item price to calculate.
          </div>
        ) : results ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="min-w-0 overflow-hidden rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 sm:col-span-2">
              <p className="truncate text-xs text-muted-foreground">
                CIF (MYR)
              </p>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums break-words sm:text-base">
                {formatMYR(results.cifMyr)}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                {formatUSD(results.cifUsd)}
              </p>
            </div>
            <ResultStat
              label="Import duty"
              value={formatDutyValue(results.importDutyMyr, isManual)}
            />
            <ResultStat
              label="Sales tax"
              value={formatDutyValue(results.salesTaxMyr, isManual)}
            />
            <ResultStat
              label="Excise duty"
              value={formatDutyValue(results.exciseDutyMyr, isManual)}
            />
            <ResultStat
              label="Total customs duty/tax"
              value={formatMYR(results.customsTaxMyr)}
              highlight={results.customsTaxMyr > 0 ? "warning" : "default"}
            />
            <ResultStat
              label="Courier/admin fees"
              value={formatMYR(courierFeesTotal)}
            />
            {inputs.othersCostMyr > 0 ? (
              <ResultStat
                label="Other costs"
                value={formatMYR(results.othersCostMyr)}
              />
            ) : null}
            <ResultStat
              label="Final landed cost (MYR)"
              value={formatMYR(results.landedCostMyr)}
              size="hero"
              highlight="purple"
            />
            <ResultStat
              label="Final landed cost (USD)"
              value={formatUSD(results.landedCostUsd)}
            />
            <ResultStat
              label="Avg cost / item (MYR)"
              value={formatMYR(results.avgCostPerItemMyr)}
            />
            <ResultStat
              label="Avg cost / item (USD)"
              value={formatUSD(results.avgCostPerItemUsd)}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
