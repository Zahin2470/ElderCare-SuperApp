import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';
import { migrate } from './migrate.js';
import { reportFatalAndExit } from './lib/monitoring.js';

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

// A safety net, not a recovery mechanism: Node's own default for both of these is already to crash
// the process, since continuing after either can leave the app in a corrupted state. This only
// makes sure the error is reported and logged before that crash happens, with a bounded wait so a
// broken reporter can never hang a restart. A process manager is expected to restart the process.
process.on('uncaughtException', (err) => reportFatalAndExit('uncaughtException', err));
process.on('unhandledRejection', (reason) => reportFatalAndExit('unhandledRejection', reason));
