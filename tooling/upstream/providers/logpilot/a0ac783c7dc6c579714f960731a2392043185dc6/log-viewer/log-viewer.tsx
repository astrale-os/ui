"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Radar } from "lucide-react";
import type { LogEntry, LogLevel, ServiceName, TimeRange, SavedFilter } from "@/lib/types";
import { generateMockLogs, generateLiveTailEntry } from "@/lib/mock-data";
import { filterLogs, exportLogsAsJson } from "@/lib/log-utils";
import { TopBar } from "./top-bar";
import { LogList } from "./log-list";
import { SidebarInspector } from "./sidebar-inspector";
import { Heatmap } from "./heatmap";
import { PasteDialog } from "./paste-dialog";
import { SavedFiltersDialog } from "./saved-filters-dialog";

export function LogViewer() {
  // Core state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLevels, setActiveLevels] = useState<Set<LogLevel>>(new Set());
  const [activeServices, setActiveServices] = useState<Set<ServiceName>>(new Set());
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");

  // UI state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveTail, setLiveTail] = useState(false);

  // Dialog state
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [savedFiltersOpen, setSavedFiltersOpen] = useState(false);

  // Live tail interval ref
  const liveTailRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate mock data on mount
  useEffect(() => {
    const data = generateMockLogs(600);
    setLogs(data);
    setIsLoading(false);
  }, []);

  // Live tail effect
  useEffect(() => {
    if (liveTail) {
      liveTailRef.current = setInterval(() => {
        const newEntry = generateLiveTailEntry();
        setLogs((prev) => [newEntry, ...prev]);
      }, 2500);
    } else {
      if (liveTailRef.current) {
        clearInterval(liveTailRef.current);
        liveTailRef.current = null;
      }
    }

    return () => {
      if (liveTailRef.current) {
        clearInterval(liveTailRef.current);
      }
    };
  }, [liveTail]);

  // Filtered logs
  const filteredLogs = useMemo(
    () =>
      filterLogs(logs, {
        levels: activeLevels,
        services: activeServices,
        timeRange,
        searchQuery,
      }),
    [logs, activeLevels, activeServices, timeRange, searchQuery]
  );

  // Handlers
  const handleToggleLevel = useCallback((level: LogLevel) => {
    setActiveLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  }, []);

  const handleServiceChange = useCallback((service: ServiceName | "all") => {
    if (service === "all") {
      setActiveServices(new Set());
    } else {
      setActiveServices(new Set([service]));
    }
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback((entry: LogEntry) => {
    setSelectedEntry((prev) => (prev?.id === entry.id ? null : entry));
    setSidebarOpen(true);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setActiveLevels(new Set());
    setActiveServices(new Set());
    setTimeRange("24h");
  }, []);

  const handleExport = useCallback(() => {
    const json = exportLogsAsJson(filteredLogs);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logpilot-export-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  const handleImport = useCallback((entries: LogEntry[]) => {
    setLogs((prev) => {
      const merged = [...entries, ...prev];
      merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return merged;
    });
  }, []);

  const handleApplyFilter = useCallback((filter: SavedFilter) => {
    setActiveLevels(new Set(filter.levels));
    setActiveServices(new Set(filter.services));
    setTimeRange(filter.timeRange);
    setSearchQuery(filter.searchQuery);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleToggleLiveTail = useCallback(() => {
    setLiveTail((prev) => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
    setSelectedEntry(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <div className="text-center space-y-3">
          <Radar className="size-8 text-blue-500 animate-spin mx-auto" />
          <div className="text-sm text-zinc-400">Generating log data…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeLevels={activeLevels}
        onToggleLevel={handleToggleLevel}
        activeServices={activeServices}
        onServiceChange={handleServiceChange}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        liveTail={liveTail}
        onToggleLiveTail={handleToggleLiveTail}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        onClearFilters={handleClearFilters}
        onExport={handleExport}
        onOpenPaste={() => setPasteDialogOpen(true)}
        onOpenSavedFilters={() => setSavedFiltersOpen(true)}
        totalCount={logs.length}
        filteredCount={filteredLogs.length}
      />

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Log list */}
        <LogList
          logs={filteredLogs}
          expandedIds={expandedIds}
          selectedEntry={selectedEntry}
          onToggleExpand={handleToggleExpand}
          onSelect={handleSelect}
        />

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-80 xl:w-96 border-l border-zinc-800 bg-zinc-950/90 shrink-0 hidden md:block">
            <SidebarInspector
              selectedEntry={selectedEntry}
              allLogs={filteredLogs}
              onClose={handleCloseSidebar}
            />
          </div>
        )}
      </div>

      {/* Heatmap */}
      <Heatmap logs={logs} />

      {/* Dialogs */}
      <PasteDialog
        open={pasteDialogOpen}
        onOpenChange={setPasteDialogOpen}
        onImport={handleImport}
      />

      <SavedFiltersDialog
        open={savedFiltersOpen}
        onOpenChange={setSavedFiltersOpen}
        currentLevels={activeLevels}
        currentServices={activeServices}
        currentTimeRange={timeRange}
        currentSearch={searchQuery}
        onApplyFilter={handleApplyFilter}
      />
    </div>
  );
}
