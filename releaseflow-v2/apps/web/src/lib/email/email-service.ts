import type { EmailProvider, EmailMessage } from './provider';
import { ResendProvider } from './resend-provider';

let provider: EmailProvider | null = null;

function validateEmailConfig(): void {
  const missing: string[] = [];
  if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY');
  if (!process.env.EMAIL_FROM) missing.push('EMAIL_FROM');
  if (missing.length > 0) {
    console.warn(`[email-service] Missing email configuration: ${missing.join(', ')}`);
  }
}

export function initEmailProvider(): void {
  const apiKey = process.env.RESEND_API_KEY || '';
  const defaultFrom = process.env.EMAIL_FROM || '';
  provider = new ResendProvider(apiKey, defaultFrom);
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
