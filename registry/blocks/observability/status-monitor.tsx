'use client'

import { cn } from '@astrale-os/ui/class-name'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@astrale-os/ui/tooltip'
import { AlertTriangleIcon, CheckCircle2Icon, CircleOffIcon, XCircleIcon } from 'lucide-react'
import React, { useEffect, useId, useMemo, useRef, useState } from 'react'

type AppStatus = 'normal' | 'warning' | 'error' | 'empty'

export type AppStatusData = {
  status: AppStatus
  timestamp?: string | Date
  info?: string
}

export interface StatusMonitorProps extends React.HTMLAttributes<HTMLDivElement> {
  statuses: AppStatusData[]
  unit?: 'days' | 'hours'
  title?: string
  showUptime?: boolean
}

interface AppStatusConfigData {
  label: string
  defaultInfo: string
  barClassName: string
  textClassName: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

interface StatusSelection {
  absoluteIndex: number
  item: AppStatusData
  source: AppStatusData[]
}

const statusConfig = {
  normal: {
    label: 'Normal',
    defaultInfo: 'Systems are operating normally.',
    barClassName: 'bg-green-600',
    textClassName: 'text-green-600',
    Icon: CheckCircle2Icon,
  },
  warning: {
    label: 'Warning',
    defaultInfo: 'Systems are operating with elevated risk or degraded service.',
    barClassName: 'bg-amber-600',
    textClassName: 'text-amber-600',
    Icon: AlertTriangleIcon,
  },
  error: {
    label: 'Error',
    defaultInfo: 'A service-impacting incident is active.',
    barClassName: 'bg-red-600',
    textClassName: 'text-red-600',
    Icon: XCircleIcon,
  },
  empty: {
    label: 'No data',
    defaultInfo: 'No status data was recorded for this period.',
    barClassName: 'bg-muted',
    textClassName: 'text-muted-foreground',
    Icon: CircleOffIcon,
  },
} satisfies Record<AppStatus, AppStatusConfigData>

const BAR_WIDTH_PX = 5
const BAR_GAP_PX = 2
const MIN_VISIBLE_SLOTS = 30
const SLOT_COUNTS = [90, 60, MIN_VISIBLE_SLOTS] as const

function getTimelineWidth(numSlots: number) {
  return numSlots * BAR_WIDTH_PX + (numSlots - 1) * BAR_GAP_PX
}

function calculateNumDisplayableBars(width: number) {
  return SLOT_COUNTS.find((slots) => width >= getTimelineWidth(slots)) ?? 30
}

function getVisibleSelectionIndex(
  selection: StatusSelection | null,
  statuses: AppStatusData[],
  visibleSlots: number,
) {
  if (
    !selection ||
    selection.source !== statuses ||
    statuses[selection.absoluteIndex] !== selection.item
  )
    return null
  const visibleIndex = selection.absoluteIndex - (statuses.length - visibleSlots)
  return visibleIndex >= 0 && visibleIndex < visibleSlots ? visibleIndex : null
}

function formatTimestamp(timestamp: AppStatusData['timestamp'], unit: 'days' | 'hours') {
  if (!timestamp) return undefined

  if (timestamp instanceof Date) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      ...(unit === 'hours' ? { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' } : {}),
    }).format(timestamp)
  }

  return timestamp
}

export default function StatusMonitor({
  statuses,
  unit = 'days',
  title,
  showUptime = true,
  className,
  ...props
}: StatusMonitorProps) {
  const triggerIdPrefix = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const pressedStatusRef = useRef<StatusSelection | null>(null)
  const visibleSlotsRef = useRef<number>(MIN_VISIBLE_SLOTS)
  const [visibleSlots, setVisibleSlots] = useState<number>(MIN_VISIBLE_SLOTS)
  const [activeStatus, setActiveStatus] = useState<StatusSelection | null>(null)

  const paddedStatuses = useMemo(() => {
    const padCount = 90 - statuses.length
    const padding: AppStatusData[] = Array(padCount > 0 ? padCount : 0).fill({
      status: 'empty',
    })
    return [...padding, ...statuses].slice(-90)
  }, [statuses])

  const visibleStatuses = useMemo(
    () => paddedStatuses.slice(-visibleSlots),
    [paddedStatuses, visibleSlots],
  )
  const uptimeLabel = useMemo(() => {
    const validStatuses = visibleStatuses.filter((status) => status.status !== 'empty')
    if (validStatuses.length === 0) return 'N/A'

    const normalCount = validStatuses.filter((status) => status.status === 'normal').length
    return `${parseFloat(((normalCount / validStatuses.length) * 100).toFixed(2))}%`
  }, [visibleStatuses])
  const activeStatusIndex = getVisibleSelectionIndex(activeStatus, paddedStatuses, visibleSlots)
  const timelineWidth = getTimelineWidth(visibleSlots)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateVisibleSlots = () => {
      const nextVisibleSlots = calculateNumDisplayableBars(container.getBoundingClientRect().width)
      if (nextVisibleSlots === visibleSlotsRef.current) return

      visibleSlotsRef.current = nextVisibleSlots
      pressedStatusRef.current = null
      setActiveStatus(null)
      setVisibleSlots(nextVisibleSlots)
    }

    updateVisibleSlots()

    const resizeObserver = new ResizeObserver(updateVisibleSlots)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn('mx-auto w-full max-w-3xl min-w-[208px] font-sans', className)}
      {...props}
    >
      <div className="mx-auto flex flex-col space-y-3" style={{ width: timelineWidth }}>
        {/* Header: Title and Uptime Percentage */}
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-foreground">{title ?? 'Application Status'}</span>
          {showUptime ? (
            <span className="font-medium text-muted-foreground">{uptimeLabel} uptime</span>
          ) : null}
        </div>

        {/* Status Bars Container */}
        <TooltipProvider>
          <Tooltip
            disableHoverablePopup
            open={activeStatusIndex !== null}
            triggerId={
              activeStatusIndex === null ? null : `${triggerIdPrefix}-status-${activeStatusIndex}`
            }
            onOpenChange={(open, details) => {
              if (open) return
              if (details.reason === 'trigger-hover' || details.reason === 'trigger-focus') return
              pressedStatusRef.current = null
              setActiveStatus(null)
            }}
          >
            <div
              className="grid h-8 gap-0.5"
              style={{
                gridTemplateColumns: `repeat(${visibleSlots}, ${BAR_WIDTH_PX}px)`,
              }}
            >
              {visibleStatuses.map((item, index) => {
                const config = statusConfig[item.status]
                const timestamp = formatTimestamp(item.timestamp, unit)
                const label = timestamp ? `${timestamp}: ${config.label}` : config.label
                const selection = {
                  absoluteIndex: paddedStatuses.length - visibleStatuses.length + index,
                  item,
                  source: paddedStatuses,
                }
                const edgeClassName = [
                  index === 0 ? 'rounded-l-sm' : '',
                  index === visibleStatuses.length - 1 ? 'rounded-r-sm' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <TooltipTrigger
                    key={index}
                    id={`${triggerIdPrefix}-status-${index}`}
                    closeOnClick={false}
                    render={
                      <button
                        type="button"
                        className={cn(
                          'h-full w-[5px] border-0 p-0 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          edgeClassName,
                          config.barClassName,
                        )}
                        aria-label={`${label}. ${item.info ?? config.defaultInfo}`}
                        onPointerEnter={() => setActiveStatus(selection)}
                        onPointerLeave={() => {
                          if (pressedStatusRef.current === null) setActiveStatus(null)
                        }}
                        onFocus={() => setActiveStatus(selection)}
                        onBlur={() => {
                          if (pressedStatusRef.current === null) setActiveStatus(null)
                        }}
                        onClick={() => {
                          const nextPressedStatus =
                            pressedStatusRef.current?.absoluteIndex === selection.absoluteIndex &&
                            pressedStatusRef.current.item === selection.item
                              ? null
                              : selection
                          pressedStatusRef.current = nextPressedStatus
                          setActiveStatus(nextPressedStatus)
                        }}
                      />
                    }
                  />
                )
              })}
            </div>
            {(() => {
              const item = activeStatus?.item
              if (!item) return null

              const config = statusConfig[item.status]
              const timestamp = formatTimestamp(item.timestamp, unit)
              const Icon = config.Icon
              return (
                <TooltipContent side="bottom" sideOffset={8}>
                  <div className="text-sm space-y-1 p-1">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`size-4 shrink-0 ${config.textClassName}`}
                        aria-hidden="true"
                      />
                      <span className={`font-bold ${config.textClassName}`}>{config.label}</span>
                    </div>
                    {timestamp ? <div className="text-background/70">{timestamp}</div> : null}
                    <div className="leading-snug text-background/80">
                      {item.info ?? config.defaultInfo}
                    </div>
                  </div>
                </TooltipContent>
              )
            })()}
          </Tooltip>
        </TooltipProvider>

        {/* Footer: Timeline Legend */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {visibleSlots} {unit} ago
          </span>
          <span>Current</span>
        </div>
      </div>
    </div>
  )
}
