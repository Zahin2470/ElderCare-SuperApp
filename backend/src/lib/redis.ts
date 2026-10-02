import { Redis } from 'ioredis';
import { config } from '../config.js';

/**
 * Shared Redis connection, used for cross-process rate limiting. Only created when REDIS_URL is
 * set — every consumer must work correctly with `redis === null` (single instance, in-memory
 * counters). Tuned to fail fast rather than hang requests or queue commands forever if Redis is
 * unreachable: callers are expected to fail OPEN on error (see rateLimitStore.ts).
 */
export const redis: Redis | null = config.REDIS_URL
  ? new Redis(config.REDIS_URL, {
      lazyConnect: true,
      connectTimeout: 300,
      maxRetriesPerRequest: 1,
      commandTimeout: 250,
      retryStrategy: (attempt: number) => Math.min(attempt * 200, 2000),
    })
  : null;

if (redis) {
  redis.on('error', (err: Error) => console.error('[redis] connection error:', err.message));
} else if (config.isProd) {
  console.warn('[redis] No REDIS_URL configured — rate limits are per-instance only. Set REDIS_URL if you run more than one server instance.');
}
