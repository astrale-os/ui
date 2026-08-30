'use client'

import { format, isSameDay } from 'date-fns'
import { useMemo } from 'react'

import type { LogEntry } from './types.js'

import { LogEntryRow } from './log-entry-row.js'

interface LogListProps {
  logs: LogEntry[]
  expandedIds: Set<string>
  selectedEntry: LogEntry | null
  onToggleExpand: (id: string) => void
  onSelect: (entry: LogEntry) => void
  viewportRef?: React.Ref<HTMLDivElement>
  onViewportScroll?: (viewport: HTMLDivElement) => void
}

export function LogList({
  logs,
  expandedIds,
  selectedEntry,
  onToggleExpand,
  onSelect,
  viewportRef,
  onViewportScroll,
}: LogListProps) {
  // Group logs by date for sticky separators
  const groupedLogs = useMemo(() => {
    const groups: { date: Date; entries: LogEntry[] }[] = []
    let currentGroup: { date: Date; entries: LogEntry[] } | null = null

    for (const log of logs) {
      if (!currentGroup || !isSameDay(currentGroup.date, log.timestamp)) {
        currentGroup = { date: log.timestamp, entries: [] }
        groups.push(currentGroup)
      }
      currentGroup.entries.push(log)
    }

    return groups
  }, [logs])

  if (logs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <div className="text-center space-y-2">
          <div className="text-4xl">📋</div>
          <div className="text-sm">No log entries match your filters</div>
          <div className="text-xs text-zinc-600">Try adjusting your search or filter criteria</div>
        </div>
      </div>
    )
  }

  let globalIndex = 0

  return (
    <div
      ref={viewportRef}
      onScroll={(event) => onViewportScroll?.(event.currentTarget)}
      className="flex-1 overflow-y-auto min-h-0"
    >
      {groupedLogs.map((group) => (
        <div key={group.date.toISOString()}>
          {/* Sticky date separator */}
          <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-700/50 px-3 py-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
              {format(group.date, 'EEEE, MMMM d, yyyy')}
            </span>
            <span className="text-[10px] text-zinc-600 ml-2">({group.entries.length} entries)</span>
          </div>

          {/* Log entries */}
          {group.entries.map((entry) => {
            const idx = globalIndex++
            return (
              <LogEntryRow
                key={entry.id}
                entry={entry}
                index={idx}
                isExpanded={expandedIds.has(entry.id)}
                isSelected={selectedEntry?.id === entry.id}
                onToggleExpand={onToggleExpand}
                onSelect={onSelect}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
