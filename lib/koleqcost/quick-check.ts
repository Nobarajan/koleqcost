export type QuickCheckResult = {
  /** 70% of market price */
  safeBuyMin: number;
  /** 80% of market price */
  safeBuyMax: number;
  /** Great Deal upper bound (≤70%) — same value as safeBuyMin */
  greatDealMax: number;
  /** Smart Buy lower bound (70% + 1 cent) */
  smartBuyMin: number;
  /** Smart Buy upper bound (80%) — same value as safeBuyMax */
  smartBuyMax: number;
  /** Fair Price lower bound (80% + 1 cent) */
  fairMin: number;
  /** Fair Price upper bound (85%) */
  fairMax: number;
  /** Slightly High lower bound (85% + 1 cent) */
  slightlyHighMin: number;
  /** Slightly High upper bound (90%) */
  slightlyHighMax: number;
  /** Walk Away threshold — displayed as "> RM{walkAwayThreshold}" (90%) */
  walkAwayThreshold: number;
};

const CENT = 0.01;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeQuickCheck(marketPrice: number): QuickCheckResult | null {
  if (!Number.isFinite(marketPrice) || marketPrice <= 0) {
    return null;
  }

  const safeBuyMin = round2(marketPrice * 0.7);
  const safeBuyMax = round2(marketPrice * 0.8);
  const fairMax = round2(marketPrice * 0.85);
  const slightlyHighMax = round2(marketPrice * 0.9);

  return {
    safeBuyMin,
    safeBuyMax,
    greatDealMax: safeBuyMin,
    smartBuyMin: round2(safeBuyMin + CENT),
    smartBuyMax: safeBuyMax,
    fairMin: round2(safeBuyMax + CENT),
    fairMax,
    slightlyHighMin: round2(fairMax + CENT),
    slightlyHighMax,
    walkAwayThreshold: slightlyHighMax,
  };
}

const wholeAmountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const decimalAmountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatQuickCheckAmount(value: number): string {
  const rounded = round2(value);
  const formatted = Number.isInteger(rounded)
    ? wholeAmountFormatter.format(rounded)
    : decimalAmountFormatter.format(rounded);
  return `RM${formatted}`;
}

export function formatQuickCheckRange(
  min: number | null,
  max: number | null,
): string {
  if (min === null && max !== null) {
    return `≤ ${formatQuickCheckAmount(max)}`;
  }
  if (min !== null && max === null) {
    return `> ${formatQuickCheckAmount(min)}`;
  }
  if (min !== null && max !== null) {
    if (min === max) {
      return formatQuickCheckAmount(min);
    }
    return `${formatQuickCheckAmount(min)} – ${formatQuickCheckAmount(max)}`;
  }
  return "—";
}
