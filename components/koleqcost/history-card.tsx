"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Copy, MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deriveHistoryResults,
  getHasSellingPrice,
} from "@/lib/koleqcost/history";
import { formatMYR, formatPercent } from "@/lib/koleqcost/format";
import { getAmountTone, getVerdictTone, toneTextClasses } from "@/lib/koleqcost/tone";
import type { HistoryEntry, ProfitVerdict } from "@/lib/koleqcost/types";
import { SELLING_METHOD_OPTIONS } from "@/lib/koleqcost/types";
import { cn } from "@/lib/utils";

type HistoryCardProps = {
  entry: HistoryEntry;
  selectionMode?: boolean;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  onOpenDetail?: (id: string) => void;
  onOpenEditor: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRename: (id: string, name: string) => void;
};

function formatSignedMYR(value: number): string {
  if (value > 0) return `+${formatMYR(value)}`;
  if (value < 0) return `-${formatMYR(Math.abs(value))}`;
  return formatMYR(0);
}

function getSellingPriceMyr(entry: HistoryEntry): number | null {
  if (!getHasSellingPrice(entry.resale)) return null;

  if (entry.resale.sellingMethod === "ebay") {
    return entry.resale.soldPriceUsd * entry.rates.usdMyr;
  }

  return entry.resale.localSellingPriceMyr;
}

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
      <Badge className="border-info/30 bg-info/10 text-info">{label}</Badge>
    );
  }

  return (
    <Badge className="border-orange-accent/30 bg-orange-accent/10 text-orange-accent">
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
        <Badge className="border-warning/30 bg-warning/10 text-warning">
          Thin margin
        </Badge>
      );
    case "okay":
      return (
        <Badge className="border-info/30 bg-info/10 text-info">Okay flip</Badge>
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

function CompactMetrics({
  entry,
  landedCostMyr,
  sellingPriceMyr,
  profitMyr,
  profitAfterMyr,
  roiPct,
  verdict,
}: {
  entry: HistoryEntry;
  landedCostMyr: number | null;
  sellingPriceMyr: number | null;
  profitMyr: number | null;
  profitAfterMyr: number | null;
  roiPct: number | null;
  verdict: ProfitVerdict;
}) {
  const hasSellingPrice = getHasSellingPrice(entry.resale);
  const landedText = landedCostMyr !== null ? formatMYR(landedCostMyr) : "—";
  const resalePct = entry.resale.resaleMultiplierPercent;

  if (!hasSellingPrice) {
    return (
      <p className="font-mono text-xs text-muted-foreground sm:text-sm">
        {landedText}
        <span> · </span>
        <span>No resale price yet</span>
      </p>
    );
  }

  const segments: ReactNode[] = [
    <span key="flow">
      {landedText}
      <span className="text-muted-foreground"> → </span>
      {sellingPriceMyr !== null ? formatMYR(sellingPriceMyr) : "—"}
    </span>,
  ];

  if (profitMyr !== null) {
    segments.push(
      <span
        key="profit"
        className={toneTextClasses[getAmountTone(profitMyr)]}
      >
        {formatSignedMYR(profitMyr)}
      </span>,
    );
  }

  if (profitAfterMyr !== null) {
    segments.push(
      <span
        key="after"
        className={toneTextClasses[getAmountTone(profitAfterMyr)]}
      >
        {resalePct}% {formatSignedMYR(profitAfterMyr)}
      </span>,
    );
  }

  if (roiPct !== null) {
    segments.push(
      <span
        key="roi"
        className={toneTextClasses[getVerdictTone(verdict)]}
      >
        ROI {formatPercent(roiPct)}
      </span>,
    );
  }

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-xs sm:text-sm">
      {segments.map((segment, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <span className="text-muted-foreground">·</span>
          ) : null}
          {segment}
        </Fragment>
      ))}
    </p>
  );
}

function InlineItemName({
  entryId,
  name,
  displayName,
  disabled,
  onRename,
}: {
  entryId: string;
  name: string;
  displayName: string;
  disabled?: boolean;
  onRename: (id: string, name: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraft(name);
    }
  }, [isEditing, name]);

  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const commit = () => {
    const next = draft.trim();
    if (next !== name.trim()) {
      onRename(entryId, next);
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft(name);
    setIsEditing(false);
  };

  if (disabled) {
    return (
      <p className="min-w-0 flex-1 truncate text-sm font-medium">{displayName}</p>
    );
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        placeholder="Untitled"
        aria-label="Item name"
        className="h-7 w-auto min-w-[6rem] max-w-full flex-none px-2 text-sm font-medium"
        style={{ width: `${Math.max(draft.length, 8)}ch` }}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className="inline-block max-w-full truncate rounded-sm text-left text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-text"
      onClick={(event) => {
        event.stopPropagation();
        setIsEditing(true);
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setIsEditing(true);
        }
      }}
    >
      {displayName}
    </button>
  );
}

export function HistoryCard({
  entry,
  selectionMode = false,
  selected = false,
  onSelectedChange,
  onOpenDetail,
  onOpenEditor,
  onDuplicate,
  onDelete,
  onTogglePin,
  onRename,
}: HistoryCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isInteractive = !selectionMode && Boolean(onOpenDetail);

  const { buyingResults, resaleResults } = useMemo(
    () => deriveHistoryResults(entry),
    [entry],
  );

  const landedCostMyr = buyingResults?.landedCostMyr ?? null;
  const sellingPriceMyr = getSellingPriceMyr(entry);
  const profitMyr = resaleResults?.profitMyr ?? null;
  const profitAfterMyr = resaleResults?.profitAfterPercentMyr ?? null;
  const roiPct = resaleResults?.roiPct ?? null;
  const verdict = resaleResults?.verdict ?? null;

  const itemName = entry.buying.note || "Untitled";

  const handleOpenDetail = () => {
    if (isInteractive) onOpenDetail?.(entry.id);
  };

  return (
    <>
      <div
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={isInteractive ? `View details for ${itemName}` : undefined}
        onClick={handleOpenDetail}
        onKeyDown={(event) => {
          if (!isInteractive) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpenDetail();
          }
        }}
        className={cn(
          "flex flex-col gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-2.5 transition-colors duration-150 sm:px-4 sm:py-3",
          entry.pinned && "border-gold-accent/50 bg-gold-accent/5",
          isInteractive &&
            "cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        )}
      >
        <div className="flex items-center gap-2">
          {selectionMode ? (
            <div
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) =>
                  onSelectedChange?.(checked === true)
                }
                aria-label={`Select ${itemName}`}
                className="size-4 shrink-0"
              />
            </div>
          ) : null}
          <div className="min-w-0 max-w-[55%] shrink sm:max-w-[65%]">
            <InlineItemName
              entryId={entry.id}
              name={entry.buying.note}
              displayName={itemName}
              disabled={selectionMode}
              onRename={onRename}
            />
          </div>

          <div className="min-w-0 flex-1" aria-hidden />
          <div
            className="flex shrink-0 items-center gap-1"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <SellingMethodBadge method={entry.resale.sellingMethod} />
            {verdict ? <VerdictBadge verdict={verdict} /> : null}

            {!selectionMode ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 shrink-0"
                      aria-label={`Actions for ${itemName}`}
                    />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onTogglePin(entry.id)}>
                    <Star
                      className={cn(
                        "size-3.5",
                        entry.pinned && "fill-gold-accent text-gold-accent",
                      )}
                    />
                    {entry.pinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenEditor(entry.id)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(entry.id)}>
                    <Copy className="size-3.5" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>

        <CompactMetrics
          entry={entry}
          landedCostMyr={landedCostMyr}
          sellingPriceMyr={sellingPriceMyr}
          profitMyr={profitMyr}
          profitAfterMyr={profitAfterMyr}
          roiPct={roiPct}
          verdict={verdict}
        />
      </div>

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
            <AlertDialogAction onClick={() => onDelete(entry.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
