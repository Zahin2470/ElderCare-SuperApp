import nodemailer from 'nodemailer';
import { SMTPServer } from 'smtp-server';
import { describe, expect, it } from 'vitest';
import { config } from '../src/config.js';
import { GatewayNotifier, NotifyError, SmtpEmailSender, TwilioSmsSender } from '../src/lib/notify.js';

/** Flips config.isProd for the duration of `fn`, always restoring it — even if `fn` throws. */
async function asProd<T>(fn: () => Promise<T>): Promise<T> {
  const was = config.isProd;
  (config as { isProd: boolean }).isProd = true;
  try { return await fn(); } finally { (config as { isProd: boolean }).isProd = was; }
}

describe('GatewayNotifier — channel routing', () => {
  it('routes a phone number to SMS and an email address to email', async () => {
    const sms: { to: string; body: string }[] = [];
    const email: { to: string; subject: string; body: string }[] = [];
    const n = new GatewayNotifier({ send: async (to, body) => void sms.push({ to, body }) }, { send: async (to, subject, body) => void email.push({ to, subject, body }) });

    await n.sendOtp('+8801712345678', '123456', 'verify');
    await n.sendOtp('demo@eldercare.com', '654321', 'reset_password');

    expect(sms).toEqual([{ to: '+8801712345678', body: expect.stringContaining('123456') }]);
    expect(email).toHaveLength(1);
    expect(email[0].to).toBe('demo@eldercare.com');
    expect(email[0].body).toContain('654321');
    expect(email[0].body).toMatch(/password reset/i); // purpose-specific wording, not the generic message
  });

  it('in production, a channel with no gateway configured is a hard failure — never a silent no-op', async () => {
    const n = new GatewayNotifier(null, null);
    await asProd(async () => {
      await expect(n.sendOtp('+8801712345678', '123456', 'verify')).rejects.toMatchObject({ status: 502, code: 'notification_failed' });
      await expect(n.sendOtp('demo@eldercare.com', '123456', 'verify')).rejects.toMatchObject({ status: 502, code: 'notification_failed' });
    });
  });

  it('configuring only one channel does not mask the other channel being unconfigured in production', async () => {
    const n = new GatewayNotifier({ send: async () => undefined }, null);
    await asProd(async () => {
      await expect(n.sendOtp('+8801712345678', '1', 'verify')).resolves.toBeUndefined(); // SMS is configured
      await expect(n.sendOtp('demo@eldercare.com', '1', 'verify')).rejects.toMatchObject({ code: 'notification_failed' }); // email is not
    });
  });

  it('outside production, a missing gateway falls back to the console instead of throwing', async () => {
    const n = new GatewayNotifier(null, null);
    await expect(n.sendOtp('+8801712345678', '123456', 'verify')).resolves.toBeUndefined();
  });
});

describe('TwilioSmsSender', () => {
  it('sends with the configured from-number and the exact body', async () => {
    const calls: unknown[] = [];
    const fakeClient = { messages: { create: async (args: unknown) => { calls.push(args); return {}; } } };
    await new TwilioSmsSender(fakeClient as never, '+8801999999999').send('+8801712345678', 'hello');
    expect(calls).toEqual([{ to: '+8801712345678', from: '+8801999999999', body: 'hello' }]);
  });

  it('wraps a Twilio API failure as a clean NotifyError, not a raw SDK exception', async () => {
    const fakeClient = { messages: { create: async () => { throw new Error('Twilio: invalid number'); } } };
    const sender = new TwilioSmsSender(fakeClient as never, '+8801999999999');
    await expect(sender.send('+880bad', 'x')).rejects.toBeInstanceOf(NotifyError);
  });
});

describe('SmtpEmailSender (against a real local SMTP server — no external network involved)', () => {
  it('actually delivers a message end-to-end over SMTP', async () => {
    const received: string[] = [];
    const server = new SMTPServer({
      authOptional: true,
      disabledCommands: ['AUTH'],
      onData(stream, _session, callback) {
        let body = '';
        stream.on('data', (d: Buffer) => { body += d.toString(); });
        stream.on('end', () => { received.push(body); callback(); });
      },
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.server.address() as { port: number }).port;
    try {
      const transport = nodemailer.createTransport({ host: '127.0.0.1', port, secure: false, ignoreTLS: true });
      await new SmtpEmailSender(transport, 'ElderCare <no-reply@eldercare.app>').send('demo@eldercare.com', 'Your code', 'Your ElderCare verification code is 482913. It expires in 5 minutes.');
      expect(received).toHaveLength(1);
      expect(received[0]).toContain('482913');
      expect(received[0]).toContain('demo@eldercare.com');
      expect(received[0]).toContain('no-reply@eldercare.app');
    } finally {
      await new Promise((r) => server.close(r as () => void));
    }
  });

  it('wraps a delivery failure (nothing listening) as NotifyError', async () => {
    const transport = nodemailer.createTransport({ host: '127.0.0.1', port: 1, connectionTimeout: 500 });
    await expect(new SmtpEmailSender(transport, 'ElderCare <no-reply@eldercare.app>').send('a@b.com', 'x', 'y')).rejects.toBeInstanceOf(NotifyError);
  });
});
