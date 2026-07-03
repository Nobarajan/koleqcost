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
