"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Copy, Pencil, Star, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResultStat, SectionLabel } from "@/components/koleqcost/result-stat";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  deriveHistoryResults,
  getHasSellingPrice,
} from "@/lib/koleqcost/history";
import {
  formatDate,
  formatMYR,
  formatPercent,
  formatRate,
  formatUSD,
} from "@/lib/koleqcost/format";
import {
  getAmountTone,
  getVerdictTone,
  toneBadgeClasses,
  toneTextClasses,
  type Tone,
} from "@/lib/koleqcost/tone";
import type { HistoryEntry, ProfitVerdict } from "@/lib/koleqcost/types";
import { SELLING_METHOD_OPTIONS } from "@/lib/koleqcost/types";
import { cn } from "@/lib/utils";

type HistoryDetailSheetProps = {
  entry: HistoryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

function SellingMethodBadge({
  method,
}: {
  method: HistoryEntry["resale"]["sellingMethod"];
}) {
  const label =
    SELLING_METHOD_OPTIONS.find((option) => option.value === method)?.label ??
    method;

  if (method === "ebay") {
    return (
      <Badge className={toneBadgeClasses.info}>{label}</Badge>
    );
  }

  return (
    <Badge className="border-orange-accent/30 bg-orange-accent/10 text-orange-accent dark:border-orange-accent/45 dark:bg-orange-accent/16 dark:text-[oklch(0.88_0.13_55)]">
      {label}
    </Badge>
  );
}

function VerdictBadge({ verdict }: { verdict: ProfitVerdict }) {
  switch (verdict) {
    case "loss":
      return <Badge variant="destructive">Loss</Badge>;
    case "thin":
      return (
        <Badge className={toneBadgeClasses.warning}>Thin margin</Badge>
      );
    case "okay":
      return (
        <Badge className={toneBadgeClasses.info}>Okay flip</Badge>
      );
    case "strong":
      return (
        <Badge className={toneBadgeClasses.positive}>Strong flip</Badge>
      );
    default:
      return null;
  }
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <SectionLabel>{title}</SectionLabel>
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-0.5">
        {children}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  tone = "neutral",
  emphasis = false,
}: {
  label: string;
  value: string;
  tone?: Tone;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 py-3 last:border-0 sm:py-2.5">
      <span className="min-w-0 flex-1 shrink text-sm text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "max-w-[52%] shrink-0 text-right font-mono text-sm tabular-nums break-all sm:max-w-[58%]",
          emphasis && "font-semibold",
          toneTextClasses[tone],
        )}
      >
        {value}
      </span>
    </div>
  );
}

function getSellingPriceMyr(entry: HistoryEntry): number | null {
  if (!getHasSellingPrice(entry.resale)) return null;

  if (entry.resale.sellingMethod === "ebay") {
    return entry.resale.soldPriceUsd * entry.rates.usdMyr;
  }

  return entry.resale.localSellingPriceMyr;
}

export function HistoryDetailSheet({
  entry,
  open,
  onOpenChange,
  onEdit,
  onDuplicate,
  onDelete,
}: HistoryDetailSheetProps) {
  const isMobile = useIsMobile();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { buyingResults, resaleResults } = useMemo(
    () => (entry ? deriveHistoryResults(entry) : { buyingResults: null, resaleResults: null }),
    [entry],
  );

  if (!entry) return null;

  const itemName = entry.buying.note.trim() || "Untitled calculation";
  const hasSellingPrice = getHasSellingPrice(entry.resale);
  const sellingPriceMyr = getSellingPriceMyr(entry);
  const isEbay = entry.resale.sellingMethod === "ebay";
  const verdict = resaleResults?.verdict ?? null;

  const profitMyr = resaleResults?.profitMyr ?? null;
  const roiPct = resaleResults?.roiPct ?? null;
  const resalePct = entry.resale.resaleMultiplierPercent;

  const courierAdminFeesMyr = buyingResults
    ? buyingResults.agentHandlingFeeMyr +
      buyingResults.ediSmkFeeMyr +
      buyingResults.otherCourierFeeMyr +
      buyingResults.othersCostMyr
    : null;

  const grossSaleUsd = isEbay
    ? entry.resale.soldPriceUsd + entry.resale.buyerShippingChargedUsd
    : 0;
  const ebayFinalValueFeeUsd = grossSaleUsd * (entry.resale.ebayFeePct / 100);
  const internationalFeeUsd =
    grossSaleUsd * (entry.resale.internationalFeePct / 100);
  const promotedFeeUsd = grossSaleUsd * (entry.resale.promotedFeePct / 100);

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(entry.id);
  };

  const handleDuplicate = () => {
    onDuplicate(entry.id);
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(entry.id);
    setDeleteOpen(false);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "flex w-full flex-col gap-0 p-0",
            isMobile
              ? "h-[92dvh] max-h-[92dvh] rounded-t-xl"
              : "sm:max-w-lg",
          )}
        >
          <SheetHeader className="shrink-0 space-y-3 border-b px-4 py-4 pr-12">
            <SheetTitle className="text-left leading-snug">{itemName}</SheetTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <SellingMethodBadge method={entry.resale.sellingMethod} />
              {verdict ? <VerdictBadge verdict={verdict} /> : null}
              {!hasSellingPrice ? (
                <Badge variant="outline" className={toneBadgeClasses.neutral}>
                  No resale price
                </Badge>
              ) : null}
              {entry.notes.trim() ? (
                <Badge variant="outline" className={cn("max-w-full truncate", toneBadgeClasses.neutral)}>
                  {entry.notes.trim()}
                </Badge>
              ) : null}
              {entry.pinned ? (
                <Badge className={toneBadgeClasses.gold}>
                  <Star className="mr-1 size-3 fill-gold-accent" />
                  Pinned
                </Badge>
              ) : null}
            </div>
          </SheetHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-5 px-4 py-4">
              <div className="space-y-2">
                <SectionLabel>Deal summary</SectionLabel>
                <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
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
                    label="Selling price"
                    value={
                      sellingPriceMyr !== null
                        ? formatMYR(sellingPriceMyr)
                        : "—"
                    }
                  />
                  <ResultStat
                    label="Profit"
                    value={profitMyr !== null ? formatMYR(profitMyr) : "—"}
                    highlight={
                      profitMyr !== null ? getAmountTone(profitMyr) : "default"
                    }
                  />
                  <ResultStat
                    label="ROI"
                    value={roiPct !== null ? formatPercent(roiPct) : "—"}
                    highlight={getVerdictTone(verdict)}
                  />
                </div>
              </div>

              {hasSellingPrice && resaleResults ? (
                <DetailSection title="Conservative view">
                  <DetailRow
                    label="Resale multiplier"
                    value={`${resalePct}%`}
                  />
                  <DetailRow
                    label={`Value after ${resalePct}%`}
                    value={formatMYR(resaleResults.resaleAfterPercentMyr)}
                  />
                  <DetailRow
                    label={`Profit after ${resalePct}%`}
                    value={formatMYR(resaleResults.profitAfterPercentMyr)}
                    tone={getAmountTone(resaleResults.profitAfterPercentMyr)}
                    emphasis
                  />
                  <DetailRow
                    label={`ROI after ${resalePct}%`}
                    value={formatPercent(resaleResults.roiAfterPercent)}
                    tone={getAmountTone(resaleResults.profitAfterPercentMyr)}
                  />
                </DetailSection>
              ) : null}

              {buyingResults ? (
                <DetailSection title="Buying breakdown">
                  <DetailRow
                    label="Item price"
                    value={formatUSD(entry.buying.itemPriceUsd)}
                  />
                  <DetailRow
                    label="Postage fee"
                    value={formatUSD(entry.buying.postageUsd)}
                  />
                  <DetailRow
                    label="Quantity"
                    value={String(Math.max(entry.buying.quantity, 1))}
                  />
                  <DetailRow
                    label="CIF USD"
                    value={formatUSD(buyingResults.cifUsd)}
                  />
                  <DetailRow
                    label="CIF MYR"
                    value={formatMYR(buyingResults.cifMyr)}
                  />
                  <DetailRow
                    label="Tax preset"
                    value={buyingResults.taxPresetLabel}
                  />
                  <DetailRow
                    label="Customs duty/tax"
                    value={formatMYR(buyingResults.customsTaxMyr)}
                  />
                  <DetailRow
                    label="Courier/admin fees"
                    value={
                      courierAdminFeesMyr !== null
                        ? formatMYR(courierAdminFeesMyr)
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Final landed cost"
                    value={formatMYR(buyingResults.landedCostMyr)}
                    tone="purple"
                    emphasis
                  />
                  <DetailRow
                    label="Average cost per item"
                    value={formatMYR(buyingResults.avgCostPerItemMyr)}
                  />
                </DetailSection>
              ) : null}

              {hasSellingPrice && resaleResults ? (
                <DetailSection title="Resale breakdown">
                  {isEbay ? (
                    <>
                      <DetailRow
                        label="eBay sold price"
                        value={formatUSD(entry.resale.soldPriceUsd)}
                      />
                      <DetailRow
                        label="Buyer shipping charged"
                        value={formatUSD(entry.resale.buyerShippingChargedUsd)}
                      />
                      <DetailRow
                        label="Shipping cost to buyer"
                        value={formatUSD(entry.resale.shippingCostToBuyerUsd)}
                      />
                      <DetailRow
                        label="eBay final value fee"
                        value={formatUSD(ebayFinalValueFeeUsd)}
                      />
                      <DetailRow
                        label="International fee"
                        value={formatUSD(internationalFeeUsd)}
                      />
                      <DetailRow
                        label="Promoted fee"
                        value={formatUSD(promotedFeeUsd)}
                      />
                      <DetailRow
                        label="Fixed order fee"
                        value={formatUSD(entry.resale.fixedOrderFeeUsd)}
                      />
                      <DetailRow
                        label="Other cost"
                        value={formatUSD(entry.resale.otherCostUsd)}
                      />
                      <DetailRow
                        label="Estimated eBay fees"
                        value={formatMYR(resaleResults.totalFeesMyr)}
                      />
                      <DetailRow
                        label="Net received"
                        value={formatMYR(resaleResults.netReceivedMyr)}
                        emphasis
                      />
                      <DetailRow
                        label="Break-even price"
                        value={
                          resaleResults.breakEvenSellPriceMyr !== null
                            ? formatMYR(resaleResults.breakEvenSellPriceMyr)
                            : "—"
                        }
                        tone="info"
                        emphasis
                      />
                    </>
                  ) : (
                    <>
                      <DetailRow
                        label="Local selling price"
                        value={formatMYR(entry.resale.localSellingPriceMyr)}
                      />
                      <DetailRow
                        label="Platform/meetup fee"
                        value={formatMYR(entry.resale.platformMeetupFeeMyr)}
                      />
                      <DetailRow
                        label="Delivery/transport cost"
                        value={formatMYR(entry.resale.deliveryTransportCostMyr)}
                      />
                      <DetailRow
                        label="Discount/nego amount"
                        value={formatMYR(entry.resale.discountNegoAmountMyr)}
                      />
                      <DetailRow
                        label="Other cost"
                        value={formatMYR(entry.resale.otherCostMyr)}
                      />
                      <DetailRow
                        label="Net received"
                        value={formatMYR(resaleResults.netReceivedMyr)}
                        emphasis
                      />
                      <DetailRow
                        label="Break-even local price"
                        value={
                          resaleResults.breakEvenSellPriceMyr !== null
                            ? formatMYR(resaleResults.breakEvenSellPriceMyr)
                            : "—"
                        }
                        tone="info"
                        emphasis
                      />
                    </>
                  )}
                </DetailSection>
              ) : null}

              <DetailSection title="Record info">
                <DetailRow
                  label="Created"
                  value={formatDate(entry.createdAt)}
                />
                <DetailRow
                  label="Last edited"
                  value={formatDate(entry.updatedAt)}
                />
                <DetailRow
                  label="USD/MYR"
                  value={formatRate(entry.rates.usdMyr)}
                />
              </DetailSection>
            </div>
          </ScrollArea>

          <SheetFooter className="gap-2 border-t px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:pb-4">
            <Button
              variant="outline"
              className="min-h-11 w-full sm:min-h-0 sm:w-auto"
              onClick={handleEdit}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="min-h-11 w-full sm:min-h-0 sm:w-auto"
              onClick={handleDuplicate}
            >
              <Copy className="size-3.5" />
              Duplicate
            </Button>
            <Button
              variant="destructive"
              className="min-h-11 w-full sm:min-h-0 sm:w-auto"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete calculation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{itemName}&rdquo; from your
              saved history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
