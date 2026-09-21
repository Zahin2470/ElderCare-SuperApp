import { z } from 'zod';

const DEV_ACCESS_SECRET = 'dev-only-access-secret-change-me-0123456789abcdef';
const DEV_OTP_SECRET = 'dev-only-otp-secret-change-me-0123456789abcdef';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().default('postgres://eldercare:eldercare_dev@127.0.0.1:5432/eldercare'),
  JWT_ACCESS_SECRET: z.string().min(32).default(DEV_ACCESS_SECRET),
  OTP_HMAC_SECRET: z.string().min(32).default(DEV_OTP_SECRET),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().default(15 * 60),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().default(30),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  TRUST_PROXY: z.coerce.number().int().default(0),
  AUTO_MIGRATE: z.enum(['true', 'false']).default('true'),
  APP_TIMEZONE: z.string().default('Asia/Dhaka'),
  STORAGE_DIR: z.string().default('./storage'),
  MAX_UPLOAD_MB: z.coerce.number().default(10),
  EMERGENCY_NUMBER: z.string().default('999'),
  HEALTH_HOTLINE: z.string().default('16263'),
  // AI
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5'),
  AI_DAILY_MESSAGE_LIMIT: z.coerce.number().int().default(30),
  // Base URL of a video-meeting host (e.g. a self-hosted Jitsi Meet). Unset = video visits are not offered.
  VIDEO_BASE_URL: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  AI_TIMEOUT_MS: z.coerce.number().int().default(25_000),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  aiEnabled: Boolean(parsed.data.ANTHROPIC_API_KEY),
};

// Fail closed: never boot a production server that signs tokens with a published default secret.
if (config.isProd) {
  if (config.JWT_ACCESS_SECRET === DEV_ACCESS_SECRET || config.OTP_HMAC_SECRET === DEV_OTP_SECRET) {
    console.error('Refusing to start: JWT_ACCESS_SECRET and OTP_HMAC_SECRET must be set to unique random values in production.');
    process.exit(1);
  }
}
