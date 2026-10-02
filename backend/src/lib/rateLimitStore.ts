import type { IncrementResponse, Options, Store } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from './redis.js';

/**
 * Wraps a Store so a Redis outage fails OPEN — the request is allowed — instead of failing
 * CLOSED, which would turn a Redis blip into a total API outage (every request 500ing). This is
 * the right tradeoff for rate limiting specifically: a temporarily-too-generous limit is far
 * cheaper than blocking all traffic. Warnings are throttled so a sustained outage doesn't flood
 * the log.
 */
class FailOpenStore implements Store {
  private windowMs = 0;
  private lastWarnAt = 0;

  constructor(private inner: Store) {}

  init(options: Options) {
    this.windowMs = options.windowMs;
    // RedisStore.init() is async internally (it preloads Lua scripts) even though the Store
    // interface types init() as fire-and-forget. Nothing in express-rate-limit awaits or catches
    // that promise, so if Redis is unreachable at startup it becomes an unhandled rejection —
    // which can crash the whole process. We must catch it ourselves.
    Promise.resolve(this.inner.init?.(options)).catch((err) => this.warn('init', err));
  }

  private warn(action: string, err: unknown) {
    const now = Date.now();
    if (now - this.lastWarnAt > 10_000) {
      console.error(`[rate-limit] Redis ${action} failed — failing open (request allowed):`, err instanceof Error ? err.message : err);
      this.lastWarnAt = now;
    }
  }

  async increment(key: string): Promise<IncrementResponse> {
    try {
      return await this.inner.increment(key);
    } catch (err) {
      this.warn('increment', err);
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }

  async decrement(key: string): Promise<void> {
    try { await this.inner.decrement(key); } catch (err) { this.warn('decrement', err); }
  }

  async resetKey(key: string): Promise<void> {
    try { await this.inner.resetKey(key); } catch (err) { this.warn('resetKey', err); }
  }
}

/**
 * A Redis-backed store shared across every server instance, or undefined (express-rate-limit's
 * own in-memory store) when no REDIS_URL is configured. `prefix` keeps each limiter's counters
 * separate in the shared Redis keyspace, so e.g. the login limiter and the OTP limiter never
 * collide even though they share one Redis database.
 */
export function sharedStore(prefix: string): Store | undefined {
  const client = redis;
  if (!client) return undefined;
  // ioredis's `call` is typed generically for its command-overload set; RedisStore only needs the
  // raw variadic-string command interface it documents, so the cast here is deliberate and narrow.
  const sendCommand = (...args: string[]): Promise<never> => (client.call as unknown as (...a: string[]) => Promise<never>)(...args);
  return new FailOpenStore(new RedisStore({ prefix: `rl:${prefix}:`, sendCommand }));
}
