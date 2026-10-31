import { NonRetriableError } from "inngest";
import { Resend } from "resend";
import type { Email, EmailProvider, SentEmail } from "./email-provider.js";

export class ResendEmailProvider implements EmailProvider {
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async send(email: Email, idempotencyKey?: string): Promise<SentEmail> {
    const { data, error } = await this.client.emails.send(
      {
        from: this.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      },
      { idempotencyKey },
    );

    if (error) {
      const status = error.statusCode;
      const message = `Resend send failed (${status ?? "unknown status"}): ${error.name}: ${error.message}`;
      const retryable =
        status === 429 || error.name === "concurrent_idempotent_requests";
      // Other 4xx (bad key, unverified sender, invalid recipient, key reused with a different payload) won't fix itself.
      if (status !== null && status >= 400 && status < 500 && !retryable) {
        throw new NonRetriableError(message);
      }
      throw new Error(message);
    }

    return { id: data.id };
  }
}
