'use client'

import { Spinner } from '@astrale-os/ui/spinner'
import { Radar, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { LogEntry, LogLevel, ServiceName, TimeRange } from './types.js'

import { LogList } from './log-list.js'
import { exportLogsAsJson, filterLogs } from './log-utils.js'
import { TopBar } from './top-bar.js'

export interface LogViewerProps {
  defaultLogs?: LogEntry[]
  isLoading?: boolean
  streamError?: string | null
  onNextLiveEntry?(): Promise<LogEntry> | LogEntry
  onCopyLogs?(logs: LogEntry[]): Promise<void> | void
  onExportLogs?(logs: LogEntry[]): Promise<void> | void
}

export function LogViewer({
  defaultLogs = [],
  isLoading = false,
  streamError = null,
  onNextLiveEntry,
  onCopyLogs,
  onExportLogs,
}: LogViewerProps = {}) {
  // Core state
  const [logs, setLogs] = useState<LogEntry[]>(defaultLogs)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [activeLevels, setActiveLevels] = useState<Set<LogLevel>>(new Set())
  const [activeServices, setActiveServices] = useState<Set<ServiceName>>(new Set())
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')

  // UI state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null)
  const [liveTail, setLiveTail] = useState(false)
  const [follow, setFollow] = useState(true)

  // Host action state
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)

  // Live tail interval ref
  const liveTailRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Follow tail viewport ref
  const viewport = useRef<HTMLDivElement>(null)

  const runAction = useCallback(
    async (
      busyMessage: string,
      successMessage: string,
      errorMessage: string,
      perform: () => Promise<void> | void,
    ) => {
      setPendingMessage(busyMessage)
      setStatus(null)
      try {
        await perform()
        setStatus({ tone: 'success', message: successMessage })
      } catch {
        setStatus({ tone: 'error', message: errorMessage })
      } finally {
        setPendingMessage(null)
      }
    },
    [],
  )

  const appendLiveEntry = useCallback(async () => {
    if (!onNextLiveEntry) return
    try {
      const newEntry = await onNextLiveEntry()
      setLogs((prev) => [newEntry, ...prev])
    } catch {
      setStatus({ tone: 'error', message: 'Could not append the next log entry.' })
    }
  }, [onNextLiveEntry])

  // Live tail effect
  useEffect(() => {
    if (liveTail) {
      liveTailRef.current = setInterval(() => {
        void appendLiveEntry()
      }, 2500)
    } else {
      if (liveTailRef.current) {
        clearInterval(liveTailRef.current)
        liveTailRef.current = null
      }
    }

    return () => {
      if (liveTailRef.current) {
        clearInterval(liveTailRef.current)
      }
    }
  }, [liveTail, appendLiveEntry])

  // Filtered logs
  const filteredLogs = useMemo(
    () =>
      filterLogs(logs, {
        levels: activeLevels,
        services: activeServices,
        timeRange,
        searchQuery,
      }),
    [logs, activeLevels, activeServices, timeRange, searchQuery],
  )

  // Follow tail effect
  useEffect(() => {
    if (!follow) {
      return
    }
    const rafId = requestAnimationFrame(() => {
      viewport.current?.scrollTo({ top: 0 })
    })

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [filteredLogs, follow])

  const handleViewportScroll = useCallback((element: HTMLDivElement) => {
    const isAtNewest = element.scrollTop <= 0

    if (isAtNewest) {
      return setFollow(true)
    }
    return setFollow(false)
  }, [])

  // Handlers
  const handleToggleLevel = useCallback((level: LogLevel) => {
    setActiveLevels((prev) => {
      const next = new Set(prev)
      if (next.has(level)) {
        next.delete(level)
      } else {
        next.add(level)
      }
      return next
    })
  }, [])

  const handleServiceChange = useCallback((service: ServiceName | 'all') => {
    if (service === 'all') {
      setActiveServices(new Set())
    } else {
      setActiveServices(new Set([service]))
    }
  }, [])

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleSelect = useCallback((entry: LogEntry) => {
    setSelectedEntry((prev) => (prev?.id === entry.id ? null : entry))
  }, [])

  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setActiveLevels(new Set())
    setActiveServices(new Set())
    setTimeRange('24h')
  }, [])

  const getLogsText = useCallback(
    () =>
      filteredLogs
        .map((e) => [e.timestamp.toISOString(), e.level, e.service, e.message].join('\t'))
        .join('\n'),
    [filteredLogs],
  )

  const handleCopy = useCallback(async () => {
    await runAction(
      'Copying logs…',
      `Copied ${filteredLogs.length} log entries to the clipboard.`,
      'Could not copy the visible logs.',
      () => (onCopyLogs ? onCopyLogs(filteredLogs) : navigator.clipboard.writeText(getLogsText())),
    )
  }, [filteredLogs, getLogsText, onCopyLogs, runAction])

  const handleExport = useCallback(async () => {
    await runAction(
      'Exporting logs…',
      `Exported ${filteredLogs.length} log entries.`,
      'Could not export the visible logs.',
      () => {
        if (onExportLogs) return onExportLogs(filteredLogs)
        const json = exportLogsAsJson(filteredLogs)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `logpilot-export-${new Date().toISOString().slice(0, 19)}.json`
        a.click()
        URL.revokeObjectURL(url)
      },
    )
  }, [filteredLogs, onExportLogs, runAction])

  const handleToggleLiveTail = useCallback(() => {
    setLiveTail((prev) => !prev)
  }, [])

  const statusMessage = status === null ? '' : status.message
  const statusToneClass = status?.tone === 'error' ? 'text-red-400' : 'text-zinc-400'

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <div className="text-center space-y-3">
          <Radar className="size-8 text-blue-500 animate-spin mx-auto" />
          <div className="text-sm text-zinc-400">Generating log data…</div>
        </div>
      </div>
    )
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
        follow={follow}
        onFollowChange={setFollow}
        isEmpty={filteredLogs.length === 0}
        onClearFilters={handleClearFilters}
        onCopy={() => void handleCopy()}
        onExport={() => void handleExport()}
        totalCount={logs.length}
        filteredCount={filteredLogs.length}
      />

      {/* Stream error */}
      {streamError ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/20 text-destructive-foreground text-xs border-b border-destructive/40 shrink-0">
          <TriangleAlert className="shrink-0" />
          <span>Stream error: {streamError}</span>
        </div>
      ) : null}

      {/* Host action feedback */}
      <p
        role="status"
        aria-live="polite"
        className={`flex items-center gap-1.5 px-3 py-1 text-xs ${statusToneClass}`}
      >
        {pendingMessage === null ? (
          statusMessage
        ) : (
          <>
            <Spinner aria-hidden className="size-3.5" />
            {pendingMessage}
          </>
        )}
      </p>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Log list */}
        <LogList
          logs={filteredLogs}
          expandedIds={expandedIds}
          selectedEntry={selectedEntry}
          onToggleExpand={handleToggleExpand}
          onSelect={handleSelect}
          viewportRef={viewport}
          onViewportScroll={handleViewportScroll}
        />
      </div>
    </div>
  )
}
