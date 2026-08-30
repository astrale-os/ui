import type { LogEntry } from './log-viewer/types.js'
import type { AppStatusData } from './status-monitor.js'

const start = Date.UTC(2026, 4, 1)
const warnings = new Set([18, 41, 57, 76])
const errors = new Set([63, 84])

export const statusMonitorActivity: AppStatusData[] = Array.from({ length: 90 }, (_, index) => {
  const timestamp = new Date(start + index * 86_400_000)
  if (errors.has(index)) {
    return {
      status: 'error',
      timestamp,
      info: 'API requests failed while traffic shifted to the recovery pool.',
    }
  }
  if (warnings.has(index)) {
    return {
      status: 'warning',
      timestamp,
      info: 'Elevated latency affected a subset of requests.',
    }
  }
  return { status: 'normal', timestamp }
})

export const logStreamLatency = 120

const streamStart = Date.now()

const seedEntries: Omit<LogEntry, 'id' | 'timestamp'>[] = [
  { level: 'INFO', service: 'API', message: 'GET /v1/deployments completed in 42ms' },
  { level: 'DEBUG', service: 'Worker', message: 'Claimed job batch 8821 from the queue' },
  { level: 'WARN', service: 'Gateway', message: 'Upstream latency above the 400ms budget' },
  {
    level: 'ERROR',
    service: 'Auth',
    message: 'Token exchange rejected for tenant acme-eu',
    stackTrace: 'TokenError: signature mismatch\n    at verify (auth/token.ts:88:11)',
  },
  { level: 'INFO', service: 'Scheduler', message: 'Nightly compaction scheduled for 02:00 UTC' },
  { level: 'DEBUG', service: 'API', message: 'Cache warm for region eu-west-1' },
  { level: 'FATAL', service: 'Worker', message: 'Worker pool exhausted, shedding load' },
  { level: 'INFO', service: 'Gateway', message: 'Routing table reloaded with 12 upstreams' },
]

export const applicationLogStream: LogEntry[] = seedEntries.map((entry, index) => ({
  ...entry,
  id: `log-${index + 1}`,
  timestamp: new Date(streamStart - index * 60_000),
}))

let liveEntries = 0

function nextLiveEntry(): LogEntry {
  liveEntries += 1
  return {
    id: `live-${liveEntries}`,
    timestamp: new Date(streamStart + liveEntries * 1000),
    level: 'INFO',
    service: 'Gateway',
    message: `Live tail entry ${liveEntries}`,
  }
}

const acknowledge = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, logStreamLatency)
  })

const refuse = async () => {
  await acknowledge()
  throw new Error('The log stream refused this request.')
}

function toLogText(logs: LogEntry[]) {
  return logs
    .map((entry) =>
      [entry.timestamp.toISOString(), entry.level, entry.service, entry.message].join('\t'),
    )
    .join('\n')
}

export const logStreamActions = {
  onNextLiveEntry: nextLiveEntry,
  async onCopyLogs(logs: LogEntry[]) {
    await acknowledge()
    try {
      await navigator.clipboard.writeText(toLogText(logs))
    } catch {
      // A host without clipboard permission still reports a completed copy action.
    }
  },
  async onExportLogs(_logs: LogEntry[]) {
    await acknowledge()
  },
}

export const logStreamRejectedActions = {
  async onNextLiveEntry(): Promise<LogEntry> {
    await refuse()
    return nextLiveEntry()
  },
  async onCopyLogs(_logs: LogEntry[]) {
    await refuse()
  },
  async onExportLogs(_logs: LogEntry[]) {
    await refuse()
  },
}
