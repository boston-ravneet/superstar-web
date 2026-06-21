export interface StageGenerationLogEntry {
  at: string;
  event: string;
  detail?: Record<string, unknown>;
}

const recentLogs: StageGenerationLogEntry[] = [];
const MAX_LOGS = 30;
const LOG_FIELD_MAX = 50000;

export function logStageGeneration(
  event: string,
  detail?: Record<string, unknown>,
): void {
  const entry: StageGenerationLogEntry = {
    at: new Date().toISOString(),
    event,
    detail: detail ? sanitizeDetail(detail) : undefined,
  };

  recentLogs.unshift(entry);
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.length = MAX_LOGS;
  }

  console.log(`[stage-builder] ${event}`);
  if (detail) {
    for (const [key, value] of Object.entries(detail)) {
      if (typeof value === "string" && value.length > 500) {
        console.log(`[stage-builder] ${event}.${key} (${value.length} chars):`);
        console.log(value);
      } else {
        console.log(`[stage-builder] ${event}.${key}:`, value);
      }
    }
  }
}

function sanitizeDetail(detail: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(detail)) {
    if (typeof value === "string" && value.length > LOG_FIELD_MAX) {
      out[key] = `${value.slice(0, LOG_FIELD_MAX)}… [${value.length} chars total]`;
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function getRecentStageGenerationLogs(): StageGenerationLogEntry[] {
  return [...recentLogs];
}

export function previewText(value: string, max = 1200): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}… [${value.length} chars total]`;
}
