export type QuickCheckCurrency = "RM" | "USD" | "JPY";

export const QUICK_CHECK_CURRENCIES: QuickCheckCurrency[] = ["RM", "USD", "JPY"];

export type QuickCheckResult = {
  target: number;
  stealMax: number;
  goodBuyMin: number;
  goodBuyMax: number;
  fairMin: number;
  fairMax: number;
  riskyMin: number;
  riskyMax: number;
  passMin: number;
};

function currencyStep(currency: QuickCheckCurrency): number {
  return currency === "JPY" ? 1 : 0.01;
}

function roundForCurrency(value: number, currency: QuickCheckCurrency): number {
  if (currency === "JPY") {
    return Math.round(value);
  }
  return Math.round(value * 100) / 100;
}

export function computeQuickCheck(
  marketPrice: number,
  currency: QuickCheckCurrency,
): QuickCheckResult | null {
  if (!Number.isFinite(marketPrice) || marketPrice <= 0) {
    return null;
  }

  const step = currencyStep(currency);

  const stealMax = roundForCurrency(marketPrice * 0.7, currency);
  const target = roundForCurrency(marketPrice * 0.8, currency);
  const fairMax = roundForCurrency(marketPrice * 0.85, currency);
  const riskyMax = roundForCurrency(marketPrice * 0.9, currency);

  const goodBuyMin = roundForCurrency(stealMax + step, currency);
  const fairMin = roundForCurrency(target + step, currency);
  const riskyMin = roundForCurrency(fairMax + step, currency);
  const passMin = roundForCurrency(riskyMax + step, currency);

  return {
    target,
    stealMax,
    goodBuyMin,
    goodBuyMax: target,
    fairMin,
    fairMax,
    riskyMin,
    riskyMax,
    passMin,
  };
}

const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatQuickCheckAmount(
  value: number,
  currency: QuickCheckCurrency,
): string {
  const formatted = amountFormatter.format(value);

  switch (currency) {
    case "RM":
      return `RM${formatted}`;
    case "USD":
      return `$${formatted}`;
    case "JPY":
      return `¥${formatted}`;
  }
}

export function formatQuickCheckRange(
  min: number | null,
  max: number | null,
  currency: QuickCheckCurrency,
): string {
  if (min === null && max !== null) {
    return `≤ ${formatQuickCheckAmount(max, currency)}`;
  }
  if (min !== null && max === null) {
    return `> ${formatQuickCheckAmount(min, currency)}`;
  }
  if (min !== null && max !== null) {
    if (min === max) {
      return formatQuickCheckAmount(min, currency);
    }
    return `${formatQuickCheckAmount(min, currency)} – ${formatQuickCheckAmount(max, currency)}`;
  }
  return "—";
}
