"use client";

import { Gem } from "lucide-react";

export function KoleqCostHeader() {
  return (
    <header className="border-b border-border/60 pb-4 sm:pb-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Gem className="size-4" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            KoleqCost
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Landed Cost & Profit Calculator for Collectors
          </p>
        </div>
      </div>
    </header>
  );
}
