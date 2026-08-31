// The one sanctioned place errors go. `console` is off by lint everywhere else.
// Never report letter plaintext, decrypted metadata, a master key or a DEK.

export type ReportLevel = "warn" | "error";

export interface ReportEntry {
  at: string;
  level: ReportLevel;
  event: string;
  detail?: string;
  requestId?: string;
}

const MAX_ENTRIES = 50;

const entries: ReportEntry[] = [];
let lastRequestId: string | undefined;

export const describeError = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

export const rememberRequestId = (id?: string) => {
  if (id) lastRequestId = id;
};

export const getLastRequestId = () => lastRequestId;

export const getRecentReports = (): readonly ReportEntry[] => entries;

export const clearReports = () => {
  entries.length = 0;
  lastRequestId = undefined;
};

export const report = (
  level: ReportLevel,
  event: string,
  detail?: unknown,
): ReportEntry => {
  const entry: ReportEntry = {
    at: new Date().toISOString(),
    level,
    event,
    detail: detail === undefined ? undefined : describeError(detail),
    requestId: lastRequestId,
  };

  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();

  if (import.meta.env.DEV) {
    // biome-ignore lint/suspicious/noConsole: the reporter is the one place a console call is allowed, and only in dev.
    console[level](`[${entry.event}]`, entry);
  }

  return entry;
};

export const installGlobalErrorReporting = () => {
  window.addEventListener("error", (event) => {
    report("error", "uncaught_error", event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    report("error", "unhandled_rejection", event.reason);
  });
};
