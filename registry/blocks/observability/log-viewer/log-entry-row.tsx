'use client'

import { cn } from '@astrale-os/ui/class-name'
import { format } from 'date-fns'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { memo, useCallback } from 'react'

import type { LogEntry } from './types.js'

import { LEVEL_COLORS, SERVICE_COLORS } from './types.js'

interface LogEntryRowProps {
  entry: LogEntry
  index: number
  isExpanded: boolean
  isSelected: boolean
  onToggleExpand: (id: string) => void
  onSelect: (entry: LogEntry) => void
}

export const LogEntryRow = memo(function LogEntryRow({
  entry,
  index,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelect,
}: LogEntryRowProps) {
  const levelColor = LEVEL_COLORS[entry.level]
  const serviceColor = SERVICE_COLORS[entry.service]

  const handleClick = useCallback(() => {
    onSelect(entry)
    onToggleExpand(entry.id)
  }, [entry, onSelect, onToggleExpand])

  return (
    <div
      className={cn(
        'border-b border-zinc-800/50 transition-colors duration-100',
        index % 2 === 0 ? 'bg-zinc-950/50' : 'bg-zinc-900/30',
        isSelected && '!bg-blue-500/10 border-l-2 border-l-blue-500',
        !isSelected && 'border-l-2 border-l-transparent',
        'hover:bg-zinc-800/40 cursor-pointer',
      )}
    >
      {/* Collapsed row */}
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={isExpanded}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left"
      >
        <span className="shrink-0 text-zinc-600">
          {isExpanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </span>

        <span className="font-mono text-[11px] text-zinc-500 shrink-0 w-[85px]">
          {format(entry.timestamp, 'HH:mm:ss.SSS')}
        </span>

        <span
          className={cn(
            'shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-[52px] text-center',
            levelColor.bg,
            levelColor.text,
          )}
        >
          {entry.level}
        </span>

        <span
          className={cn(
            'shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium w-[72px] text-center',
            serviceColor.bg,
            serviceColor.text,
          )}
        >
          {entry.service}
        </span>

        <span className="font-mono text-[12px] text-zinc-300 truncate min-w-0">
          {entry.message}
        </span>

        {entry.payload && (
          <span className="shrink-0 text-[10px] text-zinc-600 font-mono">{'{…}'}</span>
        )}
        {entry.stackTrace && (
          <span className="shrink-0 text-[10px] text-red-500/60 font-mono">⚠ stack</span>
        )}
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-10 pb-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Full message */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">Message</div>
            <div className="font-mono text-xs text-zinc-300 bg-zinc-900/80 rounded p-2 whitespace-pre-wrap break-all">
              {entry.message}
            </div>
          </div>

          {/* Stack trace */}
          {entry.stackTrace && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">
                Stack Trace
              </div>
              <pre className="font-mono text-[11px] text-red-400/80 bg-red-950/20 rounded p-2 overflow-x-auto whitespace-pre">
                {entry.stackTrace}
              </pre>
            </div>
          )}

          <div className="flex gap-4 text-[10px] text-zinc-600">
            <span>
              ID: <span className="text-zinc-400 font-mono">{entry.id}</span>
            </span>
            <span>
              Full timestamp:{' '}
              <span className="text-zinc-400 font-mono">
                {format(entry.timestamp, 'yyyy-MM-dd HH:mm:ss.SSS')}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
})
