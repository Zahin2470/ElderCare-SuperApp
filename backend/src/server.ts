import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';
import { migrate } from './migrate.js';

if (config.AUTO_MIGRATE === 'true') await migrate();

const app = createApp();
const server = app.listen(config.PORT, () => {
  console.log(`ElderCare API listening on :${config.PORT} (${config.NODE_ENV}) — AI: ${config.aiEnabled ? config.ANTHROPIC_MODEL : 'basic mode (no ANTHROPIC_API_KEY)'}`);
});

const shutdown = (sig: string) => {
  console.log(`${sig} received, shutting down`);
  server.close(() => pool.end().then(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
