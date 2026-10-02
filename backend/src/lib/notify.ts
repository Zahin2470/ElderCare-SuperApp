import nodemailer, { Transporter } from 'nodemailer';
import twilio from 'twilio';
import { config } from '../config.js';
import { HttpError } from './errors.js';

export class NotifyError extends HttpError {
  constructor(message: string) {
    super(502, 'notification_failed', message);
  }
}

/**
 * Delivery of one-time codes.
 *
 * Two real gateways are wired in: SMS via Twilio, email via any SMTP provider. Configure with
 * TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER and/or SMTP_URL (see .env.example).
 * Neither is required: with nothing configured, codes are written to the server log so the whole
 * auth flow can be exercised locally, and non-production responses echo the code back to the
 * client (see exposeDevOtp below) so local dev/tests never need real credentials.
 *
 * In production, a channel with no gateway configured is a hard failure (NotifyError → HTTP 502)
 * rather than a silent no-op: the original version of this file always "succeeded" even when
 * nothing was actually sent, which would leave a real user stuck with no code and no error.
 */
export interface Notifier {
  sendOtp(target: string, code: string, purpose: string): Promise<void>;
}

interface SmsSender { send(to: string, body: string): Promise<void> }
interface EmailSender { send(to: string, subject: string, body: string): Promise<void> }

export class TwilioSmsSender implements SmsSender {
  constructor(private client: Pick<ReturnType<typeof twilio>, 'messages'>, private from: string) {}
  async send(to: string, body: string) {
    try {
      await this.client.messages.create({ to, from: this.from, body });
    } catch (e) {
      throw new NotifyError(`Could not send the SMS (${e instanceof Error ? e.message : 'unknown error'}).`);
    }
  }
}

export class SmtpEmailSender implements EmailSender {
  constructor(private transport: Pick<Transporter, 'sendMail'>, private from: string) {}
  async send(to: string, subject: string, body: string) {
    try {
      await this.transport.sendMail({ from: this.from, to, subject, text: body });
    } catch (e) {
      throw new NotifyError(`Could not send the email (${e instanceof Error ? e.message : 'unknown error'}).`);
    }
  }
}

const otpMessage = (code: string, purpose: string) => {
  const line = purpose === 'reset_password' ? `Your ElderCare password reset code is ${code}.` : `Your ElderCare verification code is ${code}.`;
  return `${line} It expires in 5 minutes. Never share this code with anyone.`;
};

export class GatewayNotifier implements Notifier {
  constructor(private sms: SmsSender | null, private email: EmailSender | null) {}

  async sendOtp(target: string, code: string, purpose: string) {
    const isEmail = target.includes('@');
    const body = otpMessage(code, purpose);
    if (isEmail) {
      if (this.email) return void (await this.email.send(target, 'Your ElderCare verification code', body));
    } else if (this.sms) {
      return void (await this.sms.send(target, body));
    }
    // No gateway configured for this channel.
    if (config.isProd) throw new NotifyError(`No ${isEmail ? 'email' : 'SMS'} gateway is configured on this server.`);
    if (!config.isTest) console.log(`[notify:console] ${purpose} code for ${target}: ${code}`);
  }
}

function buildNotifier(): Notifier {
  const sms = config.smsEnabled
    ? new TwilioSmsSender(twilio(config.TWILIO_ACCOUNT_SID!, config.TWILIO_AUTH_TOKEN!), config.TWILIO_FROM_NUMBER!)
    : null;
  const email = config.emailEnabled ? new SmtpEmailSender(nodemailer.createTransport(config.SMTP_URL!), config.SMTP_FROM) : null;
  return new GatewayNotifier(sms, email);
}

let current: Notifier = buildNotifier();
export const getNotifier = () => current;
/** Test seam: inject a fake notifier (e.g. one backed by a local SMTP test server or a spy). */
export const setNotifier = (n: Notifier) => { current = n; };
export const notifier: Notifier = { sendOtp: (t, c, p) => current.sendOtp(t, c, p) };

/** Codes are echoed to the client ONLY outside production, so local dev/tests don't need real gateway credentials. */
export const exposeDevOtp = !config.isProd;

if (config.isProd && !config.smsEnabled && !config.emailEnabled) {
  console.warn('[notify] No SMS or email gateway configured — verification codes cannot be delivered. Set TWILIO_* or SMTP_URL.');
} else {
  if (!config.smsEnabled) console.warn('[notify] No SMS gateway configured — phone verification will fail in production. Set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER.');
  if (!config.emailEnabled) console.warn('[notify] No email gateway configured — email verification will fail in production. Set SMTP_URL.');
}
