import type { ProfitVerdict } from "./types";

export type Tone =
  | "positive"
  | "negative"
  | "warning"
  | "info"
  | "purple"
  | "gold"
  | "neutral";

export function getAmountTone(value: number | null): Tone {
  if (value === null) return "neutral";
  return value >= 0 ? "positive" : "negative";
}

export function getVerdictTone(verdict: ProfitVerdict): Tone {
  if (verdict === "loss") return "negative";
  if (verdict === "thin") return "warning";
  if (verdict === "okay" || verdict === "strong") return "positive";
  return "neutral";
}

export const toneContainerClasses: Record<Tone, string> = {
  positive: "border-positive/30 bg-positive/10 dark:bg-positive/8",
  negative: "border-destructive/30 bg-destructive/10 dark:bg-destructive/8",
  warning: "border-warning/30 bg-warning/10 dark:bg-warning/8",
  info: "border-info/30 bg-info/10 dark:bg-info/8",
  purple: "border-purple-accent/30 bg-purple-accent/10 dark:bg-purple-accent/8",
  gold: "border-gold-accent/40 bg-gold-accent/10 dark:bg-gold-accent/8",
  neutral: "border-border/60 bg-muted/30",
};

export const toneTextClasses: Record<Tone, string> = {
  positive: "text-positive",
  negative: "text-destructive",
  warning: "text-warning",
  info: "text-info",
  purple: "text-purple-accent",
  gold: "text-gold-accent",
  neutral: "text-foreground",
};

export const toneIconClasses: Record<Tone, string> = {
  positive: "text-positive",
  negative: "text-destructive",
  warning: "text-warning",
  info: "text-info",
  purple: "text-purple-accent",
  gold: "text-gold-accent",
  neutral: "text-muted-foreground",
};

/** Badge chips — slightly stronger contrast in dark mode */
export const toneBadgeClasses: Record<Tone, string> = {
  positive:
    "border-positive/30 bg-positive/10 text-positive dark:border-positive/45 dark:bg-positive/16 dark:text-[oklch(0.86_0.14_158)]",
  negative:
    "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/45 dark:bg-destructive/16 dark:text-[oklch(0.84_0.14_25)]",
  warning:
    "border-warning/30 bg-warning/10 text-warning dark:border-warning/45 dark:bg-warning/16 dark:text-[oklch(0.88_0.14_80)]",
  info: "border-info/30 bg-info/10 text-info dark:border-info/45 dark:bg-info/16 dark:text-[oklch(0.88_0.12_250)]",
  purple:
    "border-purple-accent/30 bg-purple-accent/10 text-purple-accent dark:border-purple-accent/45 dark:bg-purple-accent/16 dark:text-[oklch(0.86_0.13_300)]",
  gold: "border-gold-accent/40 bg-gold-accent/10 text-gold-accent dark:border-gold-accent/45 dark:bg-gold-accent/16 dark:text-[oklch(0.9_0.13_85)]",
  neutral:
    "border-border text-muted-foreground dark:border-border dark:bg-muted/40 dark:text-[oklch(0.78_0.02_260)]",
};
