"use client";

import { useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";
import { HistoryCard } from "@/components/koleqcost/history-card";
import { HistoryToolbar } from "@/components/koleqcost/history-toolbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { matchesHistorySearch, sortHistoryEntries } from "@/lib/koleqcost/history";
import { readHistorySort, writeHistorySort } from "@/lib/koleqcost/storage";
import type { HistoryEntry, SortOption } from "@/lib/koleqcost/types";

type HistorySectionProps = {
  history: HistoryEntry[];
  onSave: () => void;
  onDelete: (id: string) => void;
  onDeleteMany: (ids: string[]) => void;
  onClearAll: () => void;
  onDuplicate: (id: string) => void;
  onTogglePin: (id: string) => void;
  onOpenEditor: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onRename: (id: string, name: string) => void;
  canSave: boolean;
};

export function HistorySection({
  history,
  onSave,
  onDelete,
  onDeleteMany,
  onClearAll,
  onDuplicate,
  onTogglePin,
  onOpenEditor,
  onOpenDetail,
  onRename,
  canSave,
}: HistorySectionProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    setSort(readHistorySort());
  }, []);

  const handleSortChange = (value: SortOption) => {
    setSort(value);
    writeHistorySort(value);
  };

  const filteredHistory = useMemo(() => {
    const filtered = history.filter((entry) =>
      matchesHistorySearch(entry, search),
    );
    return sortHistoryEntries(filtered, sort);
  }, [history, search, sort]);

  const hasSearch = search.trim().length > 0;
  const selectedCount = selectedIds.size;

  useEffect(() => {
    if (!selectionMode) return;

    const visibleIds = new Set(filteredHistory.map((entry) => entry.id));
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => visibleIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [filteredHistory, selectionMode]);

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  };

  const toggleSelect = (id: string, selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredHistory.map((entry) => entry.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    onDeleteMany(ids);
    exitSelectionMode();
  };

  return (
    <Card
      size="sm"
      className="shadow-sm ring-1 ring-border/60 transition-all duration-200 sm:hover:-translate-y-0.5 sm:hover:shadow-md"
    >
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              Calculation history
            </CardTitle>
            <CardDescription>
              Your saved collection — edit, duplicate, and pin anytime.
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Button
              onClick={onSave}
              disabled={!canSave}
              className="min-h-11 w-full sm:min-h-0 sm:w-auto"
            >
              Save calculation
            </Button>
            {history.length > 0 && !selectionMode ? (
              <Button
                variant="outline"
                className="min-h-11 w-full sm:min-h-0 sm:w-auto"
                onClick={() => setSelectionMode(true)}
              >
                Select
              </Button>
            ) : null}
            {history.length > 0 && !selectionMode ? (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="outline" className="min-h-11 w-full sm:min-h-0 sm:w-auto">
                      Clear all history
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove all saved calculations from
                      your browser. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onClearAll}>
                      Clear all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {history.length > 0 ? (
          <HistoryToolbar
            search={search}
            sort={sort}
            onSearchChange={setSearch}
            onSortChange={handleSortChange}
          />
        ) : null}

        {selectionMode ? (
          <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center">
            <p className="text-sm text-muted-foreground sm:mr-auto">
              {selectedCount} selected
            </p>
            <Button
              variant="outline"
              className="min-h-11 w-full sm:min-h-0 sm:w-auto"
              onClick={selectAllFiltered}
              disabled={filteredHistory.length === 0}
            >
              Select all
            </Button>
            <Button
              variant="outline"
              className="min-h-11 w-full sm:min-h-0 sm:w-auto"
              onClick={clearSelection}
              disabled={selectedCount === 0}
            >
              Clear selection
            </Button>
            <Button
              variant="destructive"
              className="min-h-11 w-full sm:min-h-0 sm:w-auto"
              disabled={selectedCount === 0}
              onClick={() => setBulkDeleteOpen(true)}
            >
              Delete selected
            </Button>
            <Button
              variant="ghost"
              className="min-h-11 w-full sm:min-h-0 sm:w-auto"
              onClick={exitSelectionMode}
            >
              Cancel
            </Button>
          </div>
        ) : null}

        {history.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              No saved calculations yet.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Save a deal to track landed cost, profit, and ROI.
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            {hasSearch
              ? "No calculations match your search."
              : "No saved calculations yet."}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHistory.map((entry) => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                selectionMode={selectionMode}
                selected={selectedIds.has(entry.id)}
                onSelectedChange={(selected) => toggleSelect(entry.id, selected)}
                onOpenDetail={onOpenDetail}
                onRename={onRename}
                onOpenEditor={onOpenEditor}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
              />
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedCount} calculation
              {selectedCount === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the selected calculation
              {selectedCount === 1 ? "" : "s"} from your saved history. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
