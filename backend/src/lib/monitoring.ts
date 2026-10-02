import * as Sentry from '@sentry/node';
import { config } from '../config.js';

/**
 * Error reporting. A no-op unless SENTRY_DSN is configured, so the app behaves identically with or
 * without it — the only difference is whether unexpected errors also reach an error tracker.
 * Only ever called with unexpected (5xx-class / crash) errors — never routine 4xx failures like a
 * wrong password or a validation error, which are normal traffic, not incidents.
 */
export interface ErrorReporter {
  captureException(err: unknown, context?: Record<string, unknown>): void;
  /** Flush any buffered events before the process exits. Resolves once flushed or after `timeoutMs`. */
  flush(timeoutMs: number): Promise<void>;
}

class NoopReporter implements ErrorReporter {
  captureException() { /* nothing configured — errors still go to the console logger */ }
  async flush() { /* nothing to flush */ }
}

class SentryReporter implements ErrorReporter {
  captureException(err: unknown, context?: Record<string, unknown>) {
    Sentry.captureException(err, context ? { contexts: { request: context } } : undefined);
  }
  flush(timeoutMs: number) {
    return Sentry.flush(timeoutMs).then(() => undefined);
  }
}

let current: ErrorReporter = config.monitoringEnabled
  ? (Sentry.init({ dsn: config.SENTRY_DSN, environment: config.NODE_ENV, tracesSampleRate: 0 }), new SentryReporter())
  : new NoopReporter();

export const getReporter = () => current;
/** Test seam: inject a fake reporter (or a fresh NoopReporter) instead of the real one. */
export const setReporter = (r: ErrorReporter) => { current = r; };

if (!config.monitoringEnabled && config.isProd) {
  console.warn('[monitoring] No SENTRY_DSN configured — unexpected errors are only visible in server logs.');
}

/**
 * Report a crash that is about to take the process down (an uncaught exception or an unhandled
 * promise rejection), flush it, then exit. Node's own default behaviour for both is to crash the
 * process — this only makes sure the error is reported and logged first, with a bounded wait so a
 * broken reporter can never hang a restart. A process manager (systemd, Docker, PM2) is expected to
 * restart the process afterwards.
 */
export function reportFatalAndExit(kind: string, err: unknown) {
  console.error(`[fatal] ${kind}:`, err);
  getReporter().captureException(err, { kind });
  const timer = setTimeout(() => process.exit(1), 2000).unref();
  getReporter().flush(1800).finally(() => { clearTimeout(timer); process.exit(1); });
}
