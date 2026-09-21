import { defineConfig } from 'vitest/config';

// Tests run against a REAL PostgreSQL database (never mocks) because the risky logic — unique
// indexes, row locks, partial indexes, triggers — lives in the database.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://eldercare:eldercare_dev@127.0.0.1:5432/eldercare_test';
process.env.AI_DAILY_MESSAGE_LIMIT = '6';
process.env.ANTHROPIC_API_KEY = '';           // tests never call the real API; a fake model is injected where needed

export default defineConfig({
  test: { environment: 'node', globalSetup: ['tests/globalSetup.ts'], fileParallelism: false, testTimeout: 30_000, hookTimeout: 60_000 },
});
