import type { EmailProvider, EmailMessage } from './provider';

export class ResendProvider implements EmailProvider {
  private apiKey: string;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom: string) {
    this.apiKey = apiKey;
    this.defaultFrom = defaultFrom;
  }

  getName(): string {
    return 'resend';
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.apiKey) {
      console.warn('[ResendProvider] No API key configured — skipping email send');
      return;
    }

    const to = Array.isArray(message.to) ? message.to : [message.to];

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: message.from || this.defaultFrom,
          to,
          subject: message.subject,
          html: message.html,
          text: message.text || '',
          reply_to: message.replyTo,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Resend API error ${response.status}: ${body}`);
      }
    } catch (err) {
      console.error('[ResendProvider] Failed to send email:', err);
      throw err;
    }
  }
}
