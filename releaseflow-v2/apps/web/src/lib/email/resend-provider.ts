import type { EmailProvider, EmailMessage } from './provider';

export class ResendProvider implements EmailProvider {
  private apiKey: string;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom: string) {
    this.apiKey = apiKey;
    this.defaultFrom = defaultFrom;
    console.log({
      constructorDefaultFrom: this.defaultFrom,
      constructorJson: JSON.stringify(this.defaultFrom),
    });
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

    console.log('[Resend] Preparing API request', {
      recipient: to,
      sender: message.from || this.defaultFrom,
      subject: message.subject,
    });

    try {
      console.log('[Resend] Sending request');
      const tResendStart = Date.now();

      const resolvedFrom = message.from || this.defaultFrom;

      console.log({
        resolvedFrom,
        type: typeof resolvedFrom,
        json: JSON.stringify(resolvedFrom),
      });
      console.log({
        defaultFrom: this.defaultFrom,
        defaultFromJson: JSON.stringify(this.defaultFrom),
      });

      const payload = {
        from: resolvedFrom,
        to: to,
        subject: message.subject,
        html: message.html,
      };

      console.log(JSON.stringify({ ...payload, html: 'HTML REDACTED' }, null, 2));

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const resendApiMs = Date.now() - tResendStart;

      console.log('[Resend] Response received', {
        success: response.ok,
        messageId: response.headers.get('x-request-id') || null,
        statusCode: response.status,
      });
      console.log('[Timing] Resend API call', { ms: resendApiMs });

      console.log(response.status);
      console.log(await response.text());

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Resend API error ${response.status}: ${body}`);
      }
    } catch (err) {
      console.error('[Resend] Exception', err);
      console.error('[ResendProvider] Failed to send email:', err);
      throw err;
    }
  }
}
