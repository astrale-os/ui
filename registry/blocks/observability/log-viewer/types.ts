export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'
export type ServiceName = 'API' | 'Auth' | 'Worker' | 'Scheduler' | 'Gateway'

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  service: ServiceName
  message: string
  payload?: Record<string, unknown>
  stackTrace?: string
}

export interface SavedFilter {
  id: string
  name: string
  levels: LogLevel[]
  services: ServiceName[]
  timeRange: TimeRange
  searchQuery: string
  createdAt: string
}

export type TimeRange = '1h' | '6h' | '24h' | '7d'

export const ALL_LEVELS: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
export const ALL_SERVICES: ServiceName[] = ['API', 'Auth', 'Worker', 'Scheduler', 'Gateway']

export const LEVEL_COLORS: Record<LogLevel, { bg: string; text: string; dot: string }> = {
  DEBUG: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' },
  INFO: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  WARN: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
  ERROR: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
  FATAL: { bg: 'bg-rose-500/20', text: 'text-rose-300', dot: 'bg-rose-400' },
}

export const SERVICE_COLORS: Record<ServiceName, { bg: string; text: string }> = {
  API: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  Auth: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  Worker: { bg: 'bg-green-500/20', text: 'text-green-400' },
  Scheduler: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  Gateway: { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
}

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '1h': 'Last 1 hour',
  '6h': 'Last 6 hours',
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
}
