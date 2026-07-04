"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, toast } from "sonner";
import { BuyingCostCard } from "@/components/koleqcost/buying-cost-card";
import { DealSnapshot } from "@/components/koleqcost/deal-snapshot";
import { EbayResaleCard } from "@/components/koleqcost/ebay-resale-card";
import { HistoryDetailSheet } from "@/components/koleqcost/history-detail-sheet";
import { HistoryEditSheet } from "@/components/koleqcost/history-edit-sheet";
import { HistorySection } from "@/components/koleqcost/history-section";
import { KoleqCostHeader } from "@/components/koleqcost/koleqcost-header";
import { KoleqCostFooter } from "@/components/koleqcost/koleqcost-footer";
import { RiskWarningPanel } from "@/components/koleqcost/risk-warning-panel";
import {
  computeBuyingCost,
  computeResale,
} from "@/lib/koleqcost/calculations";
import {
  createHistoryEntry,
  duplicateHistoryEntry,
  applyQuickEdit,
} from "@/lib/koleqcost/history";
import {
  addHistoryEntry,
  clearHistory,
  deleteHistoryEntry,
  deleteHistoryEntries,
  getInitialRates,
  readHistory,
  replaceHistoryEntry,
  writeStoredRates,
} from "@/lib/koleqcost/storage";
import {
  DEFAULT_BUYING_INPUTS,
  DEFAULT_RESALE_INPUTS,
  FALLBACK_RATES,
  type BuyingInputs,
  type ResaleInputs,
  type ExchangeRates,
  type HistoryEntry,
} from "@/lib/koleqcost/types";
const RATES_API_URL = "/api/rates";
const THEME_STORAGE_KEY = "koleqcost-theme";

type RatesApiResponse = {
  usdMyr: number;
  lastUpdatedUtc: string;
  source: "live";
};

function getInitialDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function KoleqCostView() {
  const [rates, setRates] = useState<ExchangeRates>(FALLBACK_RATES);
  const [manualOverride, setManualOverride] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [buyingInputs, setBuyingInputs] =
    useState<BuyingInputs>(DEFAULT_BUYING_INPUTS);
  const [resaleInputs, setResaleInputs] =
    useState<ResaleInputs>(DEFAULT_RESALE_INPUTS);
  const [ebayOpen, setEbayOpen] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<HistoryEntry | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  useEffect(() => {
    const stored = getInitialRates();
    setRates(stored);
    setManualOverride(stored.source === "manual");
    setHistory(readHistory());
    setIsDark(getInitialDarkMode());
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    const themeColor = isDark ? "#282624" : "#fbfbf9";
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", themeColor);
  }, [isDark]);

  const fetchRates = useCallback(async () => {
    setIsLoadingRates(true);
    setFetchError(null);

    try {
      const response = await fetch(RATES_API_URL);
      if (!response.ok) {
        throw new Error("Unable to fetch live exchange rates.");
      }

      const data = (await response.json()) as RatesApiResponse;
      if (!data.usdMyr) {
        throw new Error("Exchange rate API returned an invalid response.");
      }

      const nextRates: ExchangeRates = {
        usdMyr: data.usdMyr,
        lastUpdatedUtc: data.lastUpdatedUtc,
        source: "live",
      };

      if (!manualOverride) {
        setRates(nextRates);
        writeStoredRates(nextRates);
      }
    } catch {
      const cached = getInitialRates();
      const fallbackMessage =
        "Could not fetch live rates. Using fallback or cached values — you can override manually.";

      setFetchError(fallbackMessage);

      if (!manualOverride) {
        const nextRates =
          cached.source !== "fallback"
            ? { ...cached, source: "cached" as const }
            : FALLBACK_RATES;
        setRates(nextRates);
        writeStoredRates(nextRates);
      }
    } finally {
      setIsLoadingRates(false);
    }
  }, [manualOverride]);

  useEffect(() => {
    if (!hydrated) return;
    void fetchRates();
  }, [hydrated, fetchRates]);

  const hasItemPrice = buyingInputs.itemPriceUsd > 0;
  const hasSellingPrice =
    resaleInputs.sellingMethod === "ebay"
      ? resaleInputs.soldPriceUsd > 0
      : resaleInputs.localSellingPriceMyr > 0;

  const buyingResults = useMemo(() => {
    if (!hasItemPrice) return null;
    return computeBuyingCost(buyingInputs, rates.usdMyr);
  }, [buyingInputs, hasItemPrice, rates.usdMyr]);

  const resaleResults = useMemo(() => {
    if (!hasSellingPrice || !buyingResults) return null;
    return computeResale(
      resaleInputs,
      buyingResults,
      rates.usdMyr,
    );
  }, [buyingResults, hasSellingPrice, resaleInputs, rates.usdMyr]);

  const handleToggleTheme = () => {
    setIsDark((current) => {
      const next = !current;
      localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
      return next;
    });
  };

  const handleBuyingInputChange = <K extends keyof BuyingInputs>(
    field: K,
    value: BuyingInputs[K],
  ) => {
    setBuyingInputs((current) => ({ ...current, [field]: value }));
  };

  const handleResaleInputChange = <K extends keyof ResaleInputs>(
    field: K,
    value: ResaleInputs[K],
  ) => {
    setResaleInputs((current) => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    if (!buyingResults) {
      toast.error("Enter item price before saving.");
      return;
    }

    const entry = createHistoryEntry(buyingInputs, resaleInputs, rates);
    addHistoryEntry(entry);
    setHistory(readHistory());
    toast.success("Calculation saved.");
  };

  const handleDelete = (id: string) => {
    deleteHistoryEntry(id);
    setHistory(readHistory());
    toast.success("Calculation removed.");
  };

  const handleDeleteMany = (ids: string[]) => {
    if (ids.length === 0) return;

    deleteHistoryEntries(ids);
    setHistory(readHistory());
    toast.success(
      ids.length === 1
        ? "Calculation removed."
        : `${ids.length} calculations removed.`,
    );
  };

  const handleClearAll = () => {
    clearHistory();
    setHistory([]);
    toast.success("History cleared.");
  };

  const detailEntryId = detailEntry?.id;

  useEffect(() => {
    if (!detailEntryId) return;

    const updated = history.find((item) => item.id === detailEntryId) ?? null;
    if (updated) {
      setDetailEntry(updated);
    } else {
      setDetailEntry(null);
      setDetailSheetOpen(false);
    }
  }, [history, detailEntryId]);

  const handleOpenEditor = (id: string) => {
    const entry = history.find((item) => item.id === id) ?? null;
    setEditingEntry(entry);
    setEditSheetOpen(Boolean(entry));
  };

  const handleOpenDetail = (id: string) => {
    const entry = history.find((item) => item.id === id) ?? null;
    setDetailEntry(entry);
    setDetailSheetOpen(Boolean(entry));
  };

  const handleSaveEdit = (updated: HistoryEntry) => {
    setHistory((current) =>
      current.map((entry) => (entry.id === updated.id ? updated : entry)),
    );
    replaceHistoryEntry(updated);
    toast.success("Calculation updated.");
  };

  const handleDuplicate = (id: string) => {
    const entry = history.find((item) => item.id === id);
    if (!entry) return;

    const duplicate = duplicateHistoryEntry(entry);
    addHistoryEntry(duplicate);
    setHistory(readHistory());
    toast.success("Calculation duplicated.");
  };

  const handleRename = (id: string, name: string) => {
    setHistory((current) =>
      current.map((entry) => {
        if (entry.id !== id) return entry;
        const updated = applyQuickEdit(entry, { note: name });
        replaceHistoryEntry(updated);
        return updated;
      }),
    );
  };

  const handleTogglePin = (id: string) => {
    setHistory((current) => {
      const next = current.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              pinned: !entry.pinned,
              updatedAt: new Date().toISOString(),
            }
          : entry,
      );
      next.forEach((entry) => {
        if (entry.id === id) {
          replaceHistoryEntry(entry);
        }
      });
      return next;
    });
  };

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-x-hidden bg-background text-foreground pt-[env(safe-area-inset-top)] pb-24 sm:pb-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col space-y-6 px-5 py-5 sm:space-y-8 sm:px-6 sm:py-8">
        <KoleqCostHeader
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          onRefresh={() => void fetchRates()}
          usdMyr={rates.usdMyr}
          isLoadingRate={isLoadingRates && !manualOverride}
          isRefreshing={isLoadingRates}
          fetchError={fetchError}
        />

        <DealSnapshot
          buyingResults={buyingResults}
          resaleResults={resaleResults}
          hasItemPrice={hasItemPrice}
          hasSellingPrice={hasSellingPrice}
          resaleMultiplierPercent={resaleInputs.resaleMultiplierPercent}
        />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <BuyingCostCard
              inputs={buyingInputs}
              results={buyingResults}
              hasItemPrice={hasItemPrice}
              onInputChange={handleBuyingInputChange}
            />

            {buyingResults && (
              <RiskWarningPanel
                cifMyr={buyingResults.cifMyr}
                taxPreset={buyingInputs.taxPreset}
              />
            )}
          </div>

          <EbayResaleCard
            open={ebayOpen}
            onOpenChange={setEbayOpen}
            inputs={resaleInputs}
            results={resaleResults}
            rates={rates}
            hasSellingPrice={hasSellingPrice}
            onInputChange={handleResaleInputChange}
          />
        </div>

        <HistorySection
          history={history}
          onSave={handleSave}
          onDelete={handleDelete}
          onDeleteMany={handleDeleteMany}
          onClearAll={handleClearAll}
          onDuplicate={handleDuplicate}
          onTogglePin={handleTogglePin}
          onOpenEditor={handleOpenEditor}
          onOpenDetail={handleOpenDetail}
          onRename={handleRename}
          canSave={Boolean(buyingResults)}
        />

        <HistoryDetailSheet
          entry={detailEntry}
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
          onEdit={handleOpenEditor}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />

        <HistoryEditSheet
          entry={editingEntry}
          open={editSheetOpen}
          onOpenChange={setEditSheetOpen}
          onSave={handleSaveEdit}
        />

        <KoleqCostFooter />
      </div>

      <Sonner
        theme={isDark ? "dark" : "light"}
        position="bottom-right"
        richColors
        closeButton
        offset={16}
        mobileOffset={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
        icons={{
          success: <CircleCheckIcon className="size-4" />,
          info: <InfoIcon className="size-4" />,
          warning: <TriangleAlertIcon className="size-4" />,
          error: <OctagonXIcon className="size-4" />,
          loading: <Loader2Icon className="size-4 animate-spin" />,
        }}
        toastOptions={{
          classNames: {
            toast: "cn-toast",
          },
        }}
      />
    </div>
  );
}
