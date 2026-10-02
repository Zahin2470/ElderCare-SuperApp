// Minimal ambient types for the 'smtp-server' package (used only in tests, to run a real local
// SMTP server against nodemailer without needing external credentials or network access).
declare module 'smtp-server' {
  import type { Server } from 'node:net';
  import type { Duplex } from 'node:stream';

  export interface SMTPServerOptions {
    authOptional?: boolean;
    disabledCommands?: string[];
    onData?: (stream: Duplex, session: unknown, callback: (err?: Error) => void) => void;
  }

  export class SMTPServer {
    constructor(options?: SMTPServerOptions);
    server: Server;
    listen(port: number, host: string, callback?: () => void): void;
    close(callback?: (err?: Error) => void): void;
  }
}
