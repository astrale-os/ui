import { subHours, subDays, isAfter } from "date-fns";
import type { LogEntry, LogLevel, ServiceName, TimeRange } from "./types";

export function filterLogs(
  logs: LogEntry[],
  opts: {
    levels: Set<LogLevel>;
    services: Set<ServiceName>;
    timeRange: TimeRange;
    searchQuery: string;
  }
): LogEntry[] {
  const now = new Date();
  const cutoff = getTimeRangeCutoff(now, opts.timeRange);
  const query = opts.searchQuery.toLowerCase().trim();

  return logs.filter((entry) => {
    if (opts.levels.size > 0 && !opts.levels.has(entry.level)) return false;
    if (opts.services.size > 0 && !opts.services.has(entry.service)) return false;
    if (!isAfter(entry.timestamp, cutoff)) return false;
    if (query && !matchesSearch(entry, query)) return false;
    return true;
  });
}

function getTimeRangeCutoff(now: Date, range: TimeRange): Date {
  switch (range) {
    case "1h":
      return subHours(now, 1);
    case "6h":
      return subHours(now, 6);
    case "24h":
      return subHours(now, 24);
    case "7d":
      return subDays(now, 7);
  }
}

function matchesSearch(entry: LogEntry, query: string): boolean {
  if (entry.message.toLowerCase().includes(query)) return true;
  if (entry.service.toLowerCase().includes(query)) return true;
  if (entry.level.toLowerCase().includes(query)) return true;
  if (entry.payload && JSON.stringify(entry.payload).toLowerCase().includes(query)) return true;
  if (entry.stackTrace?.toLowerCase().includes(query)) return true;
  return false;
}

export function parseRawLogs(raw: string): LogEntry[] {
  const lines = raw.split("\n").filter((l) => l.trim());
  const entries: LogEntry[] = [];

  for (const line of lines) {
    const entry = tryParseJsonLog(line) ?? tryParseTextLog(line);
    if (entry) entries.push(entry);
  }

  return entries;
}

function tryParseJsonLog(line: string): LogEntry | null {
  try {
    const obj = JSON.parse(line) as Record<string, unknown>;
    if (!obj.message && !obj.msg) return null;

    return {
      id: `imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: obj.timestamp ? new Date(obj.timestamp as string) : new Date(),
      level: normalizeLevel(String(obj.level ?? obj.severity ?? "INFO")),
      service: normalizeService(String(obj.service ?? obj.source ?? "API")),
      message: String(obj.message ?? obj.msg),
      payload: obj.data ? (obj.data as Record<string, unknown>) : undefined,
      stackTrace: obj.stack ? String(obj.stack) : undefined,
    };
  } catch {
    return null;
  }
}

function tryParseTextLog(line: string): LogEntry | null {
  // Common format: [2025-01-01 12:00:00] [ERROR] [API] Some message
  const match = line.match(
    /\[?([\d\-T:.Z+ ]+)\]?\s*\[?(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL)\]?\s*\[?(\w+)\]?\s*[-:]?\s*(.+)/i
  );

  if (match) {
    return {
      id: `imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date(match[1]),
      level: normalizeLevel(match[2]),
      service: normalizeService(match[3]),
      message: match[4].trim(),
    };
  }

  // Fallback: treat entire line as message
  return {
    id: `imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date(),
    level: "INFO",
    service: "API",
    message: line.trim(),
  };
}

function normalizeLevel(raw: string): LogLevel {
  const upper = raw.toUpperCase();
  if (upper === "WARNING" || upper === "WARN") return "WARN";
  if (upper === "CRITICAL" || upper === "FATAL") return "FATAL";
  if (["DEBUG", "INFO", "ERROR"].includes(upper)) return upper as LogLevel;
  return "INFO";
}

function normalizeService(raw: string): ServiceName {
  const valid: ServiceName[] = ["API", "Auth", "Worker", "Scheduler", "Gateway"];
  const found = valid.find((s) => s.toLowerCase() === raw.toLowerCase());
  return found ?? "API";
}

export function buildHeatmapData(
  logs: LogEntry[]
): { hour: number; label: string; counts: Record<LogLevel, number> }[] {
  const now = new Date();
  const data: { hour: number; label: string; counts: Record<LogLevel, number> }[] = [];

  for (let i = 23; i >= 0; i--) {
    const hourStart = new Date(now);
    hourStart.setHours(now.getHours() - i, 0, 0, 0);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourStart.getHours() + 1);

    const hourLabel = `${hourStart.getHours().toString().padStart(2, "0")}:00`;
    const counts: Record<LogLevel, number> = {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      FATAL: 0,
    };

    for (const entry of logs) {
      if (entry.timestamp >= hourStart && entry.timestamp < hourEnd) {
        counts[entry.level]++;
      }
    }

    data.push({ hour: i, label: hourLabel, counts });
  }

  return data;
}

export function exportLogsAsJson(logs: LogEntry[]): string {
  const serializable = logs.map((l) => ({
    id: l.id,
    timestamp: l.timestamp.toISOString(),
    level: l.level,
    service: l.service,
    message: l.message,
    ...(l.payload && { payload: l.payload }),
    ...(l.stackTrace && { stackTrace: l.stackTrace }),
  }));
  return JSON.stringify(serializable, null, 2);
}
