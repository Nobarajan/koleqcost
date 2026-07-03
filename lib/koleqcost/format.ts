const usdFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const myrFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUSD(value: number): string {
  return `$${usdFormatter.format(value)}`;
}

export function formatMYR(value: number): string {
  return `RM${myrFormatter.format(value)}`;
}

export function formatPercent(fraction: number | null): string {
  if (fraction === null || !Number.isFinite(fraction)) return "—";
  return `${(fraction * 100).toFixed(2)}%`;
}

export function formatRate(value: number): string {
  return value.toFixed(4);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatFxShortTimestamp(utc: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(utc));
}

export function formatUtcTimestamp(utc: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(utc));
}
