import type { DisplayCurrency, ExchangeRates, HistoryEntry, SortOption } from "./types";
import {
  DEFAULT_PROFIT_DISPLAY_CURRENCY,
  DEFAULT_RESALE_DISPLAY_CURRENCY,
  DEFAULT_SORT_OPTION,
  DISPLAY_CURRENCY_OPTIONS,
  FALLBACK_RATES,
  SORT_OPTIONS,
} from "./types";
import { normalizeHistoryEntry } from "./history";

const RATES_KEY = "koleqcost-rates";
const HISTORY_KEY = "koleqcost-history";
const RESALE_CURRENCY_KEY = "koleqcost-resale-display-currency";
const PROFIT_CURRENCY_KEY = "koleqcost-profit-display-currency";
const HISTORY_SORT_KEY = "koleqcost-history-sort";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function readStoredRates(): ExchangeRates | null {
  const stored = readJson<ExchangeRates & { usdJpy?: number }>(RATES_KEY);
  if (!stored) return null;

  return {
    usdMyr: stored.usdMyr,
    lastUpdatedUtc: stored.lastUpdatedUtc,
    source: stored.source,
  };
}

export function writeStoredRates(rates: ExchangeRates) {
  writeJson(RATES_KEY, rates);
}

export function getInitialRates(): ExchangeRates {
  return readStoredRates() ?? FALLBACK_RATES;
}

export function readHistory(): HistoryEntry[] {
  const raw = readJson<unknown[]>(HISTORY_KEY) ?? [];
  let migrated = false;

  const entries = raw
    .map((item) => {
      const normalized = normalizeHistoryEntry(item);
      if (!normalized) return null;
      if (item && typeof item === "object" && !("buying" in item)) {
        migrated = true;
      }
      return normalized;
    })
    .filter((entry): entry is HistoryEntry => entry !== null);

  if (migrated) {
    writeHistory(entries);
  }

  return entries;
}

export function writeHistory(entries: HistoryEntry[]) {
  writeJson(HISTORY_KEY, entries);
}

export function addHistoryEntry(entry: HistoryEntry) {
  writeHistory([entry, ...readHistory()]);
}

export function replaceHistoryEntry(entry: HistoryEntry) {
  writeHistory(
    readHistory().map((existing) =>
      existing.id === entry.id ? entry : existing,
    ),
  );
}

export function deleteHistoryEntry(id: string) {
  writeHistory(readHistory().filter((entry) => entry.id !== id));
}

export function deleteHistoryEntries(ids: string[]) {
  const idSet = new Set(ids);
  writeHistory(readHistory().filter((entry) => !idSet.has(entry.id)));
}

export function clearHistory() {
  writeHistory([]);
}

function isDisplayCurrency(value: unknown): value is DisplayCurrency {
  if (value === "JPY") return false;
  return (
    typeof value === "string" &&
    DISPLAY_CURRENCY_OPTIONS.includes(value as DisplayCurrency)
  );
}

function normalizeDisplayCurrency(value: unknown): DisplayCurrency {
  if (value === "JPY") return "MYR";
  return isDisplayCurrency(value) ? value : DEFAULT_RESALE_DISPLAY_CURRENCY;
}

export function readResaleDisplayCurrency(): DisplayCurrency {
  const stored = readJson<string>(RESALE_CURRENCY_KEY);
  return normalizeDisplayCurrency(stored);
}

export function writeResaleDisplayCurrency(value: DisplayCurrency) {
  writeJson(RESALE_CURRENCY_KEY, value);
}

export function readProfitDisplayCurrency(): DisplayCurrency {
  const stored = readJson<string>(PROFIT_CURRENCY_KEY);
  if (stored === "JPY") return "ALL";
  return isDisplayCurrency(stored)
    ? stored
    : DEFAULT_PROFIT_DISPLAY_CURRENCY;
}

export function writeProfitDisplayCurrency(value: DisplayCurrency) {
  writeJson(PROFIT_CURRENCY_KEY, value);
}

const LEGACY_SORT_MAP: Record<string, SortOption> = {
  oldest: "newest",
  "roi-asc": "roi-desc",
  alphabetical: "newest",
};

function normalizeSortOption(value: unknown): SortOption {
  if (
    typeof value === "string" &&
    SORT_OPTIONS.some((option) => option.value === value)
  ) {
    return value as SortOption;
  }

  if (typeof value === "string" && value in LEGACY_SORT_MAP) {
    return LEGACY_SORT_MAP[value];
  }

  return DEFAULT_SORT_OPTION;
}

export function readHistorySort(): SortOption {
  const stored = readJson<string>(HISTORY_SORT_KEY);
  return normalizeSortOption(stored);
}

export function writeHistorySort(value: SortOption) {
  writeJson(HISTORY_SORT_KEY, value);
}
