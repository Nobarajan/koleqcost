"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResultStat, SectionLabel } from "@/components/koleqcost/result-stat";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  computeBuyingCost,
  computeResale,
} from "@/lib/koleqcost/calculations";
import {
  getHasItemPrice,
  getHasSellingPrice,
} from "@/lib/koleqcost/history";
import { formatMYR, formatPercent } from "@/lib/koleqcost/format";
import { getAmountTone, getVerdictTone } from "@/lib/koleqcost/tone";
import type {
  BuyingInputs,
  HistoryEntry,
  ResaleInputs,
  SellingMethod,
  TaxPreset,
} from "@/lib/koleqcost/types";
import { SELLING_METHOD_OPTIONS, TAX_PRESET_OPTIONS, TAX_PRESET_SHORT_LABELS } from "@/lib/koleqcost/types";

type HistoryEditSheetProps = {
  entry: HistoryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: HistoryEntry) => void;
};

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

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <SectionLabel>{title}</SectionLabel>
      {children}
    </div>
  );
}

export function HistoryEditSheet({
  entry,
  open,
  onOpenChange,
  onSave,
}: HistoryEditSheetProps) {
  const [draftBuying, setDraftBuying] = useState<BuyingInputs | null>(null);
  const [draftResale, setDraftResale] = useState<ResaleInputs | null>(null);
  const [draftRates, setDraftRates] = useState<{ usdMyr: number } | null>(
    null,
  );
  const [draftNotes, setDraftNotes] = useState("");

  useEffect(() => {
    if (!open || !entry) return;

    setDraftBuying({ ...entry.buying });
    setDraftResale({ ...entry.resale });
    setDraftRates({ ...entry.rates });
    setDraftNotes(entry.notes);
  }, [entry, open]);

  const hasItemPrice = draftBuying ? getHasItemPrice(draftBuying) : false;
  const hasSellingPrice = draftResale ? getHasSellingPrice(draftResale) : false;
  const isEbay = draftResale?.sellingMethod === "ebay";

  const buyingResults = useMemo(() => {
    if (!draftBuying || !draftRates || !hasItemPrice) return null;
    return computeBuyingCost(
      draftBuying,
      draftRates.usdMyr,
    );
  }, [draftBuying, draftRates, hasItemPrice]);

  const resaleResults = useMemo(() => {
    if (!draftResale || !draftRates || !hasSellingPrice || !buyingResults) {
      return null;
    }
    return computeResale(
      draftResale,
      buyingResults,
      draftRates.usdMyr,
    );
  }, [buyingResults, draftRates, draftResale, hasSellingPrice]);

  const handleBuyingInputChange = <K extends keyof BuyingInputs>(
    field: K,
    value: BuyingInputs[K],
  ) => {
    setDraftBuying((current) =>
      current ? { ...current, [field]: value } : current,
    );
  };

  const handleResaleInputChange = <K extends keyof ResaleInputs>(
    field: K,
    value: ResaleInputs[K],
  ) => {
    setDraftResale((current) =>
      current ? { ...current, [field]: value } : current,
    );
  };

  const handleSave = () => {
    if (!entry || !draftBuying || !draftResale || !draftRates) return;

    onSave({
      ...entry,
      buying: draftBuying,
      resale: draftResale,
      rates: draftRates,
      notes: draftNotes,
      updatedAt: new Date().toISOString(),
    });
    onOpenChange(false);
  };

  const isManualTax = draftBuying?.taxPreset === "manual";
  const isCustomTax = draftBuying?.taxPreset === "custom";

  const profitMyr = resaleResults?.profitMyr ?? null;
  const profitAfterMyr = resaleResults?.profitAfterPercentMyr ?? null;
  const roiPct = resaleResults?.roiPct ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>Edit calculation</SheetTitle>
          <SheetDescription>
            Update the details below. Values recalculate instantly.
          </SheetDescription>
        </SheetHeader>

        {entry && draftBuying && draftResale && draftRates ? (
          <>
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-6 px-4 py-4">
                <FormSection title="Basic info">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-item-name" className="text-xs">
                      Item name
                    </Label>
                    <Input
                      id="edit-item-name"
                      placeholder="e.g. PSA 10 Charizard"
                      value={draftBuying.note}
                      onChange={(e) =>
                        handleBuyingInputChange("note", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <NumberField
                      id="edit-quantity"
                      label="Quantity"
                      value={draftBuying.quantity}
                      step="1"
                      onChange={(v) =>
                        handleBuyingInputChange(
                          "quantity",
                          Math.max(parseInt(v, 10) || 1, 1),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-notes" className="text-xs">
                      Notes (optional)
                    </Label>
                    <Textarea
                      id="edit-notes"
                      placeholder="Condition, seller, listing link, etc."
                      value={draftNotes}
                      onChange={(e) => setDraftNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </FormSection>

                <FormSection title="Buying details">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <NumberField
                      id="edit-item-price"
                      label="Item price (USD)"
                      value={draftBuying.itemPriceUsd}
                      onChange={(v) =>
                        handleBuyingInputChange(
                          "itemPriceUsd",
                          parseFloat(v) || 0,
                        )
                      }
                    />
                    <NumberField
                      id="edit-postage"
                      label="Postage fee (USD)"
                      value={draftBuying.postageUsd}
                      onChange={(v) =>
                        handleBuyingInputChange("postageUsd", parseFloat(v) || 0)
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-tax-preset" className="text-xs">
                      Tax preset
                    </Label>
                    <Select
                      value={draftBuying.taxPreset}
                      onValueChange={(value) =>
                        handleBuyingInputChange("taxPreset", value as TaxPreset)
                      }
                    >
                      <SelectTrigger id="edit-tax-preset" className="w-full bg-background">
                        <SelectValue placeholder="Select tax preset">
                          {TAX_PRESET_SHORT_LABELS[draftBuying.taxPreset]}
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
                  </div>

                  {isManualTax ? (
                    <NumberField
                      id="edit-manual-customs"
                      label="Actual customs duty/tax paid (RM)"
                      value={draftBuying.manualCustomsChargeMyr}
                      step="1"
                      onChange={(v) =>
                        handleBuyingInputChange(
                          "manualCustomsChargeMyr",
                          parseFloat(v) || 0,
                        )
                      }
                    />
                  ) : null}

                  {isCustomTax ? (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <NumberField
                        id="edit-import-duty"
                        label="Import duty (%)"
                        value={draftBuying.importDutyPct}
                        onChange={(v) =>
                          handleBuyingInputChange(
                            "importDutyPct",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                      <NumberField
                        id="edit-sales-tax"
                        label="Sales tax (%)"
                        value={draftBuying.salesTaxPct}
                        onChange={(v) =>
                          handleBuyingInputChange(
                            "salesTaxPct",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                      <NumberField
                        id="edit-excise-duty"
                        label="Excise duty (%)"
                        value={draftBuying.exciseDutyPct}
                        onChange={(v) =>
                          handleBuyingInputChange(
                            "exciseDutyPct",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Courier / admin fees
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <NumberField
                        id="edit-agent-handling"
                        label="Agent handling (RM)"
                        value={draftBuying.agentHandlingFeeMyr}
                        step="1"
                        onChange={(v) =>
                          handleBuyingInputChange(
                            "agentHandlingFeeMyr",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                      <NumberField
                        id="edit-edi-smk"
                        label="EDI / SMK (RM)"
                        value={draftBuying.ediSmkFeeMyr}
                        step="1"
                        onChange={(v) =>
                          handleBuyingInputChange(
                            "ediSmkFeeMyr",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                      <NumberField
                        id="edit-other-courier"
                        label="Other courier (RM)"
                        value={draftBuying.otherCourierFeeMyr}
                        step="1"
                        onChange={(v) =>
                          handleBuyingInputChange(
                            "otherCourierFeeMyr",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                    </div>
                  </div>
                </FormSection>

                <FormSection title="Resale details">
                  <Tabs
                    value={draftResale.sellingMethod}
                    onValueChange={(next) =>
                      handleResaleInputChange(
                        "sellingMethod",
                        next as SellingMethod,
                      )
                    }
                  >
                    <TabsList className="h-9 w-full">
                      {SELLING_METHOD_OPTIONS.map((option) => (
                        <TabsTrigger
                          key={option.value}
                          value={option.value}
                          className="flex-1 text-xs sm:text-sm"
                        >
                          {option.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>

                  {isEbay ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <NumberField
                        id="edit-sold-price"
                        label="Sold price (USD)"
                        value={draftResale.soldPriceUsd}
                        onChange={(v) =>
                          handleResaleInputChange(
                            "soldPriceUsd",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                      <NumberField
                        id="edit-resale-pct"
                        label="Resale %"
                        value={draftResale.resaleMultiplierPercent}
                        step="1"
                        onChange={(v) =>
                          handleResaleInputChange(
                            "resaleMultiplierPercent",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                      <NumberField
                        id="edit-ebay-fee"
                        label="eBay final value fee (%)"
                        value={draftResale.ebayFeePct}
                        onChange={(v) =>
                          handleResaleInputChange(
                            "ebayFeePct",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                      <NumberField
                        id="edit-intl-fee"
                        label="International fee (%)"
                        value={draftResale.internationalFeePct}
                        onChange={(v) =>
                          handleResaleInputChange(
                            "internationalFeePct",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                      <NumberField
                        id="edit-shipping-cost"
                        label="Shipping cost to buyer (USD)"
                        value={draftResale.shippingCostToBuyerUsd}
                        onChange={(v) =>
                          handleResaleInputChange(
                            "shippingCostToBuyerUsd",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                      <NumberField
                        id="edit-other-cost-usd"
                        label="Other cost (USD)"
                        value={draftResale.otherCostUsd}
                        onChange={(v) =>
                          handleResaleInputChange(
                            "otherCostUsd",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <NumberField
                        id="edit-local-price"
                        label="Local selling price (RM)"
                        value={draftResale.localSellingPriceMyr}
                        step="1"
                        onChange={(v) =>
                          handleResaleInputChange(
                            "localSellingPriceMyr",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                      <NumberField
                        id="edit-resale-pct-physical"
                        label="Resale %"
                        value={draftResale.resaleMultiplierPercent}
                        step="1"
                        onChange={(v) =>
                          handleResaleInputChange(
                            "resaleMultiplierPercent",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                      <NumberField
                        id="edit-platform-fee"
                        label="Platform/meetup fee (RM)"
                        value={draftResale.platformMeetupFeeMyr}
                        step="1"
                        onChange={(v) =>
                          handleResaleInputChange(
                            "platformMeetupFeeMyr",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                      <NumberField
                        id="edit-delivery-cost"
                        label="Delivery/transport cost (RM)"
                        value={draftResale.deliveryTransportCostMyr}
                        step="1"
                        onChange={(v) =>
                          handleResaleInputChange(
                            "deliveryTransportCostMyr",
                            parseFloat(v) || 0,
                          )
                        }
                      />
                    </div>
                  )}
                </FormSection>

                <FormSection title="Preview summary">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <ResultStat
                      label="Landed cost"
                      value={
                        buyingResults
                          ? formatMYR(buyingResults.landedCostMyr)
                          : "—"
                      }
                      highlight="purple"
                    />
                    <ResultStat
                      label="Profit"
                      value={profitMyr !== null ? formatMYR(profitMyr) : "—"}
                      highlight={
                        profitMyr !== null ? getAmountTone(profitMyr) : "default"
                      }
                    />
                    <ResultStat
                      label={`After ${draftResale.resaleMultiplierPercent}%`}
                      value={
                        profitAfterMyr !== null
                          ? formatMYR(profitAfterMyr)
                          : "—"
                      }
                      highlight={
                        profitAfterMyr !== null
                          ? getAmountTone(profitAfterMyr)
                          : "default"
                      }
                    />
                    <ResultStat
                      label="ROI"
                      value={roiPct !== null ? formatPercent(roiPct) : "—"}
                      highlight={getVerdictTone(resaleResults?.verdict ?? null)}
                    />
                  </div>
                </FormSection>
              </div>
            </ScrollArea>

            <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save changes</Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
