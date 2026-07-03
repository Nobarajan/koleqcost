"use client";

import { AlertTriangle, Info } from "lucide-react";
import type { TaxPreset } from "@/lib/koleqcost/types";

type RiskWarningPanelProps = {
  cifMyr: number | null;
  taxPreset: TaxPreset;
};

export function RiskWarningPanel({ cifMyr, taxPreset }: RiskWarningPanelProps) {
  if (cifMyr === null) return null;

  let message = "";
  let isWarning = false;

  if (taxPreset === "courier") {
    message =
      "Courier estimate taxes the full CIF value — the RM1,000 exemption does not apply here.";
    isWarning = true;
  } else if (taxPreset === "manual") {
    message =
      "Using your manually entered customs charge instead of an estimate.";
  } else if (taxPreset === "custom") {
    message =
      "Custom rates mode — verify your duty percentages and tax basis match your import scenario.";
  } else if (cifMyr < 500) {
    message =
      "Low value range. Still check if tax was already charged by seller/platform.";
  } else if (cifMyr <= 1000) {
    message =
      "Below RM1,000 exemption in this calculator, but courier/import treatment may differ.";
    isWarning = true;
  } else {
    message =
      "Tax applies on the amount exceeding RM1,000 based on your selected assumptions.";
    isWarning = true;
  }

  return (
    <div className="space-y-1.5">
      <div
        className={
          isWarning
            ? "flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm leading-relaxed text-warning sm:px-3 sm:py-2"
            : "flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-3.5 py-3 text-sm leading-relaxed text-muted-foreground sm:px-3 sm:py-2"
        }
      >
        {isWarning ? (
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        ) : (
          <Info className="mt-0.5 size-4 shrink-0" />
        )}
        <p>{message}</p>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Courier/K1 imports may not use the RM1,000 traveller exemption. Actual
        charges depend on HS code, customs valuation, courier, declaration, and
        official customs assessment.
      </p>
    </div>
  );
}
