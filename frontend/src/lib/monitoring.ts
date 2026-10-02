/**
 * Error reporting for the browser. A no-op unless VITE_SENTRY_DSN is set at build time — with
 * nothing configured, the Sentry SDK is never even downloaded (it's loaded via a dynamic import,
 * which Vite code-splits into its own chunk that's only fetched once the import actually runs).
 * Errors always still reach the console either way.
 */
export interface ErrorReporter {
  captureException(err: unknown, context?: Record<string, unknown>): void;
}

class NoopReporter implements ErrorReporter {
  captureException() { /* nothing configured */ }
}

class SentryReporter implements ErrorReporter {
  constructor(private sentry: Pick<typeof import('@sentry/react'), 'captureException'>) {}
  captureException(err: unknown, context?: Record<string, unknown>) {
    this.sentry.captureException(err, context ? { contexts: { info: context } } : undefined);
  }
}

let current: ErrorReporter = new NoopReporter();
export const getReporter = () => current;
/** Test seam: inject a fake reporter. */
export const setReporter = (r: ErrorReporter) => { current = r; };

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (dsn) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({ dsn, environment: import.meta.env.MODE, tracesSampleRate: 0 });
    setReporter(new SentryReporter(Sentry));
  }).catch((e) => console.error('[monitoring] failed to load error-reporting SDK:', e));
}
