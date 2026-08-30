'use client'

import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'
import { Toggle } from '@astrale-os/ui/toggle'
import { ArrowDownToLine, Copy, Download, Pause, Play, Search, X } from 'lucide-react'
import { useCallback } from 'react'

import type { LogLevel, ServiceName, TimeRange } from './types.js'

import { ALL_LEVELS, ALL_SERVICES, LEVEL_COLORS, TIME_RANGE_LABELS } from './types.js'

interface TopBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeLevels: Set<LogLevel>
  onToggleLevel: (level: LogLevel) => void
  activeServices: Set<ServiceName>
  onServiceChange: (service: ServiceName | 'all') => void
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
  liveTail: boolean
  onToggleLiveTail: () => void
  follow: boolean
  onFollowChange: (follow: boolean) => void
  isEmpty: boolean
  onClearFilters: () => void
  onCopy: () => void
  onExport: () => void
  totalCount: number
  filteredCount: number
}

export function TopBar({
  searchQuery,
  onSearchChange,
  activeLevels,
  onToggleLevel,
  activeServices,
  onServiceChange,
  timeRange,
  onTimeRangeChange,
  liveTail,
  onToggleLiveTail,
  follow,
  onFollowChange,
  isEmpty,
  onClearFilters,
  onCopy,
  onExport,
  totalCount,
  filteredCount,
}: TopBarProps) {
  const handleServiceSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onServiceChange(e.target.value as ServiceName | 'all')
    },
    [onServiceChange],
  )

  const handleTimeRangeSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onTimeRangeChange(e.target.value as TimeRange)
    },
    [onTimeRangeChange],
  )

  const hasActiveFilters =
    activeLevels.size > 0 ||
    activeServices.size > 0 ||
    searchQuery.trim() !== '' ||
    timeRange !== '24h'

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      {/* Row 1: Search + actions */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 pl-8 pr-8 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-colors font-mono"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Count badge */}
        <span className="text-[11px] text-zinc-500 font-mono shrink-0">
          {filteredCount === totalCount ? (
            <>{totalCount} entries</>
          ) : (
            <>
              {filteredCount}
              <span className="text-zinc-600"> / {totalCount}</span>
            </>
          )}
        </span>

        <div className="h-4 w-px bg-zinc-800" />

        {/* Live tail */}
        <Button
          variant={liveTail ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleLiveTail}
          aria-pressed={liveTail}
          className={cn(liveTail && 'bg-green-600 hover:bg-green-700 text-white border-green-600')}
        >
          {liveTail ? <Pause className="size-3.5 mr-1" /> : <Play className="size-3.5 mr-1" />}
          {liveTail ? 'Tailing' : 'Live Tail'}
        </Button>

        <div className="h-4 w-px bg-zinc-800" />

        {/* Action buttons */}
        <Button variant="ghost" size="icon-sm" onClick={onCopy} aria-label="Copy" title="Copy">
          <Copy className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onExport}
          aria-label="Export filtered logs"
          title="Export filtered logs"
        >
          <Download className="size-3.5" />
        </Button>

        <div className="h-4 w-px bg-zinc-800" />

        {/* Follow logs */}
        <Toggle
          onPressedChange={onFollowChange}
          pressed={isEmpty ? false : follow}
          disabled={isEmpty}
          variant="outline"
          size="sm"
          aria-label="Toggle follow logs"
          title="Follow logs"
        >
          <ArrowDownToLine className="size-4" />
        </Toggle>
      </div>

      {/* Row 2: Filters */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-zinc-800/50 flex-wrap">
        {/* Level toggles */}
        <span className="text-[10px] uppercase tracking-wider text-zinc-600 mr-1">Level</span>
        <div className="flex items-center gap-1">
          {ALL_LEVELS.map((level) => {
            const colors = LEVEL_COLORS[level]
            const isActive = activeLevels.has(level)
            return (
              <button
                key={level}
                type="button"
                onClick={() => onToggleLevel(level)}
                aria-pressed={isActive}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-100 border',
                  isActive
                    ? cn(colors.bg, colors.text, 'border-current/20')
                    : 'bg-zinc-900 text-zinc-600 border-zinc-800 hover:text-zinc-400 hover:border-zinc-700',
                )}
              >
                {level}
              </button>
            )
          })}
        </div>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        {/* Service filter */}
        <span className="text-[10px] uppercase tracking-wider text-zinc-600 mr-1">Service</span>
        <select
          value={activeServices.size === 0 ? 'all' : Array.from(activeServices)[0]}
          onChange={handleServiceSelect}
          aria-label="Service"
          className="h-6 rounded border border-zinc-700 bg-zinc-900 px-2 text-[11px] text-zinc-400 outline-none focus:border-blue-500/50 cursor-pointer"
        >
          <option value="all">All Services</option>
          {ALL_SERVICES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        {/* Time range */}
        <span className="text-[10px] uppercase tracking-wider text-zinc-600 mr-1">Time</span>
        <select
          value={timeRange}
          onChange={handleTimeRangeSelect}
          aria-label="Time"
          className="h-6 rounded border border-zinc-700 bg-zinc-900 px-2 text-[11px] text-zinc-400 outline-none focus:border-blue-500/50 cursor-pointer"
        >
          {Object.entries(TIME_RANGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <>
            <div className="h-4 w-px bg-zinc-800 mx-1" />
            <button
              type="button"
              onClick={onClearFilters}
              className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="size-3" />
              Clear filters
            </button>
          </>
        )}
      </div>
    </div>
  )
}
