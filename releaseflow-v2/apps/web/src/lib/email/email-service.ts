import type { EmailProvider, EmailMessage } from './provider';
import { ResendProvider } from './resend-provider';

let provider: EmailProvider | null = null;

export function initEmailProvider(apiKey?: string): void {
  if (apiKey) {
    provider = new ResendProvider(apiKey);
  } else {
    provider = new ResendProvider(process.env.RESEND_API_KEY || '');
  }
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
  const p = getEmailProvider();
  await p.send(message);
}

export function buildEmailParams(to: string, subject: string, html: string, text?: string): EmailMessage {
  return { to, subject, html, text };
}
