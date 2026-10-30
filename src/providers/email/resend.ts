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
      throw new Error(
        `Resend send failed (${error.statusCode ?? "unknown status"}): ${error.name}: ${error.message}`,
      );
    }

    return { id: data.id };
  }
}
