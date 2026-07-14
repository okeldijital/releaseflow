import type { EmailProvider, EmailMessage } from './provider';
import { ResendProvider } from './resend-provider';

let provider: EmailProvider | null = null;

function validateEmailConfig(): void {
  const tValidateStart = Date.now();
  console.log('[Email] Config presence', {
    APP_URL: Boolean(process.env.APP_URL),
    RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
    EMAIL_FROM: Boolean(process.env.EMAIL_FROM),
    EMAIL_REPLY_TO: Boolean(process.env.EMAIL_REPLY_TO),
  });

  const missing: string[] = [];
  if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY');
  if (!process.env.EMAIL_FROM) missing.push('EMAIL_FROM');
  if (missing.length > 0) {
    console.warn(`[email-service] Missing email configuration: ${missing.join(', ')}`);
  }
  const configValidateMs = Date.now() - tValidateStart;
  console.log('[Timing] Configuration validation', { ms: configValidateMs });
}

export function initEmailProvider(): void {
  const apiKey = process.env.RESEND_API_KEY || '';
  const defaultFrom = process.env.EMAIL_FROM || '';
  console.log('[Email] Initialising Resend provider');
  const tInitStart = Date.now();
  provider = new ResendProvider(apiKey, defaultFrom);
  const providerInitMs = Date.now() - tInitStart;
  console.log('[Email] Resend provider initialised');
  console.log('[Timing] Provider initialisation', { ms: providerInitMs });
}

export function getEmailProvider(): EmailProvider {
  if (!provider) {
    initEmailProvider();
  }
  return provider!;
}

export function setEmailProvider(p: EmailProvider): void {
  provider = p;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  console.log('[Email] sendEmail entered');
  validateEmailConfig();
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return;
  }
  const p = getEmailProvider();
  await p.send(message);
}

export function buildEmailParams(to: string, subject: string, html: string, text?: string, replyTo?: string): EmailMessage {
  const message: EmailMessage = { to, subject, html, text };
  const resolvedReplyTo = replyTo || process.env.EMAIL_REPLY_TO;
  if (resolvedReplyTo) {
    message.replyTo = resolvedReplyTo;
  }
  return message;
}
