import { computeBuyingCost, computeResale } from "./calculations";
import type {
  BuyingInputs,
  BuyingResults,
  ExchangeRates,
  HistoryEntry,
  LegacyHistoryEntry,
  ResaleInputs,
  ResaleResults,
  SortOption,
} from "./types";
import {
  DEFAULT_BUYING_INPUTS,
  DEFAULT_RESALE_INPUTS,
} from "./types";

export type HistoryDerivedResults = {
  buyingResults: BuyingResults | null;
  resaleResults: ResaleResults | null;
};

export type QuickEditPatch = {
  note?: string;
  quantity?: number;
  soldPriceUsd?: number;
  localSellingPriceMyr?: number;
  resaleMultiplierPercent?: number;
};

export function getHasItemPrice(buying: BuyingInputs): boolean {
  return buying.itemPriceUsd > 0;
}

export function getHasSellingPrice(resale: ResaleInputs): boolean {
  return resale.sellingMethod === "ebay"
    ? resale.soldPriceUsd > 0
    : resale.localSellingPriceMyr > 0;
}

export function deriveHistoryResults(
  entry: HistoryEntry,
): HistoryDerivedResults {
  const { usdMyr } = entry.rates;

  if (!getHasItemPrice(entry.buying)) {
    return { buyingResults: null, resaleResults: null };
  }

  const buyingResults = computeBuyingCost(entry.buying, usdMyr);
  if (!buyingResults) {
    return { buyingResults: null, resaleResults: null };
  }

  if (!getHasSellingPrice(entry.resale)) {
    return { buyingResults, resaleResults: null };
  }

  const resaleResults = computeResale(
    entry.resale,
    buyingResults,
    usdMyr,
  );

  return { buyingResults, resaleResults };
}

export function createHistoryEntry(
  buying: BuyingInputs,
  resale: ResaleInputs,
  rates: ExchangeRates,
  notes = "",
): HistoryEntry {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    buying,
    resale,
    rates: { usdMyr: rates.usdMyr },
    notes,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateHistoryEntry(entry: HistoryEntry): HistoryEntry {
  const now = new Date().toISOString();
  return {
    ...entry,
    id: crypto.randomUUID(),
    buying: {
      ...entry.buying,
      note: entry.buying.note ? `${entry.buying.note} (Copy)` : "(Copy)",
    },
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function applyQuickEdit(
  entry: HistoryEntry,
  patch: QuickEditPatch,
): HistoryEntry {
  const buying = { ...entry.buying };
  const resale = { ...entry.resale };

  if (patch.note !== undefined) buying.note = patch.note;
  if (patch.quantity !== undefined) buying.quantity = Math.max(patch.quantity, 1);
  if (patch.soldPriceUsd !== undefined) resale.soldPriceUsd = patch.soldPriceUsd;
  if (patch.localSellingPriceMyr !== undefined) {
    resale.localSellingPriceMyr = patch.localSellingPriceMyr;
  }
  if (patch.resaleMultiplierPercent !== undefined) {
    resale.resaleMultiplierPercent = patch.resaleMultiplierPercent;
  }

  return {
    ...entry,
    buying,
    resale,
    updatedAt: new Date().toISOString(),
  };
}

export function matchesHistorySearch(
  entry: HistoryEntry,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const itemName = entry.buying.note.toLowerCase();
  const notes = entry.notes.toLowerCase();

  return itemName.includes(normalized) || notes.includes(normalized);
}

function getProfitSortValue(entry: HistoryEntry): number {
  const { resaleResults } = deriveHistoryResults(entry);
  return resaleResults?.profitMyr ?? Number.NEGATIVE_INFINITY;
}

function getRoiSortValue(entry: HistoryEntry): number {
  const { resaleResults } = deriveHistoryResults(entry);
  return resaleResults?.roiPct ?? Number.NEGATIVE_INFINITY;
}

function compareEntries(
  a: HistoryEntry,
  b: HistoryEntry,
  sort: SortOption,
): number {
  switch (sort) {
    case "newest":
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "profit-desc":
      return getProfitSortValue(b) - getProfitSortValue(a);
    case "profit-asc":
      return getProfitSortValue(a) - getProfitSortValue(b);
    case "roi-desc":
      return getRoiSortValue(b) - getRoiSortValue(a);
  }
}

export function sortHistoryEntries(
  entries: HistoryEntry[],
  sort: SortOption,
): HistoryEntry[] {
  const pinned = entries.filter((entry) => entry.pinned);
  const unpinned = entries.filter((entry) => !entry.pinned);

  pinned.sort((a, b) => compareEntries(a, b, sort));
  unpinned.sort((a, b) => compareEntries(a, b, sort));

  return [...pinned, ...unpinned];
}

export function isLegacyHistoryEntry(
  raw: unknown,
): raw is LegacyHistoryEntry {
  if (!raw || typeof raw !== "object") return false;
  const entry = raw as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.savedAt === "string" &&
    typeof entry.itemPriceUsd === "number" &&
    !("buying" in entry)
  );
}

export function isHistoryEntry(raw: unknown): raw is HistoryEntry {
  if (!raw || typeof raw !== "object") return false;
  const entry = raw as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.createdAt === "string" &&
    typeof entry.updatedAt === "string" &&
    entry.buying !== null &&
    typeof entry.buying === "object" &&
    entry.resale !== null &&
    typeof entry.resale === "object" &&
    entry.rates !== null &&
    typeof entry.rates === "object"
  );
}

export function migrateLegacyHistoryEntry(
  legacy: LegacyHistoryEntry,
): HistoryEntry {
  const buying: BuyingInputs = {
    ...DEFAULT_BUYING_INPUTS,
    itemPriceUsd: legacy.itemPriceUsd,
    postageUsd: legacy.postageUsd,
    quantity: legacy.quantity,
    note: legacy.note,
    manualCustomsChargeMyr: legacy.totalTaxMyr,
  };

  const resale: ResaleInputs = {
    ...DEFAULT_RESALE_INPUTS,
    sellingMethod: legacy.sellingMethod ?? DEFAULT_RESALE_INPUTS.sellingMethod,
    soldPriceUsd:
      legacy.ebaySoldPriceUsd ??
      legacy.sellingPriceUsd ??
      DEFAULT_RESALE_INPUTS.soldPriceUsd,
    localSellingPriceMyr:
      legacy.sellingPriceMyr ?? DEFAULT_RESALE_INPUTS.localSellingPriceMyr,
    resaleMultiplierPercent:
      legacy.resaleMultiplierPercent ??
      DEFAULT_RESALE_INPUTS.resaleMultiplierPercent,
  };

  const timestamp = legacy.savedAt;

  return {
    id: legacy.id,
    buying,
    resale,
    rates: { usdMyr: legacy.usdMyr },
    notes: "",
    pinned: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function normalizeHistoryEntry(raw: unknown): HistoryEntry | null {
  if (isHistoryEntry(raw)) {
    return {
      ...raw,
      rates: { usdMyr: raw.rates.usdMyr },
      pinned: raw.pinned ?? false,
      notes: raw.notes ?? "",
    };
  }

  if (isLegacyHistoryEntry(raw)) {
    return migrateLegacyHistoryEntry(raw);
  }

  return null;
}
