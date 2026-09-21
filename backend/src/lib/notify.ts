import { config } from '../config.js';

/**
 * Delivery of one-time codes.
 *
 * ONLY the console notifier is implemented here: it prints the code to the server log so the whole
 * flow can be exercised locally. To go live, add a real SMS gateway (e.g. SSL Wireless, Twilio,
 * Robi/GP bulk SMS) and an email sender behind this same interface — nothing else needs to change.
 */
export interface Notifier {
  sendOtp(target: string, code: string, purpose: string): Promise<void>;
}

class ConsoleNotifier implements Notifier {
  async sendOtp(target: string, code: string, purpose: string) {
    if (config.isTest) return;
    console.log(`[notify:console] ${purpose} code for ${target}: ${code}`);
  }
}

export const notifier: Notifier = new ConsoleNotifier();

/** Codes are echoed in API responses ONLY outside production, so local dev/tests don't need an SMS gateway. */
export const exposeDevOtp = !config.isProd;

if (config.isProd) {
  console.warn('[notify] No SMS/email gateway configured — OTP codes are only written to the server log. Implement Notifier in src/lib/notify.ts.');
}
