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

  async send(email: Email): Promise<SentEmail> {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    if (error) {
      const status = error.statusCode;
      const message = `Resend send failed (${status ?? "unknown status"}): ${error.name}: ${error.message}`;
      // 4xx other than 429 (bad key, unverified sender, invalid recipient) won't fix itself.
      if (status !== null && status >= 400 && status < 500 && status !== 429) {
        throw new NonRetriableError(message);
      }
      throw new Error(message);
    }

    return { id: data.id };
  }
}
