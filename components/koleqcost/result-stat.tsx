import { cn } from "@/lib/utils";
import {
  toneContainerClasses,
  toneTextClasses,
  type Tone,
} from "@/lib/koleqcost/tone";
import type { ReactNode } from "react";

export type StatHighlight = Tone | "default";

type ResultStatSize = "default" | "subtotal" | "hero";

type ResultStatProps = {
  label: string;
  value: string;
  highlight?: StatHighlight;
  size?: ResultStatSize;
  className?: string;
};

function resolveTone(highlight: StatHighlight): Tone {
  return highlight === "default" ? "neutral" : highlight;
}

export function ResultStat({
  label,
  value,
  highlight = "default",
  size = "default",
  className,
}: ResultStatProps) {
  const isHero = size === "hero";
  const isSubtotal = size === "subtotal";
  const spansTwoCols = isHero || isSubtotal;
  const tone = resolveTone(highlight);
  const hasTone = highlight !== "default";

  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border px-3 py-2.5 transition-all duration-200 ease-out",
        spansTwoCols && "shadow-sm hover:-translate-y-0.5 hover:shadow-md",
        hasTone || spansTwoCols
          ? toneContainerClasses[tone]
          : "border-border/60 bg-muted/30",
        spansTwoCols ? "sm:col-span-2" : "col-span-1",
        className,
      )}
    >
      <p
        className={cn(
          "truncate text-muted-foreground",
          spansTwoCols
            ? "text-xs font-medium uppercase tracking-wider"
            : "text-xs",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono font-semibold tabular-nums tracking-tight break-words transition-all duration-200 ease-out",
          isHero && "text-2xl sm:text-3xl lg:text-4xl",
          isSubtotal && "text-lg sm:text-xl",
          !spansTwoCols && "text-sm sm:text-base",
          toneTextClasses[tone],
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </p>
  );
}

export { SectionLabel };
