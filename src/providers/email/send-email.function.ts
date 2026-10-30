import { config } from "../../config.js";
import { inngest } from "../../inngest/client.js";
import { emailSend } from "../../messages/email-send.js";
import type { EmailProvider } from "./email-provider.js";
import { ResendEmailProvider } from "./resend.js";
import { renderMovieEmail } from "./template.js";

const provider: EmailProvider = new ResendEmailProvider(
  config.RESEND_API_KEY,
  config.EMAIL_FROM,
);

export const sendEmail = inngest.createFunction(
  { id: "send-email", triggers: [emailSend] },
  async ({ event, step }) => {
    return step.run("resend-send", () =>
      provider.send({
        to: event.data.recipient_email,
        ...renderMovieEmail(event.data.movie),
      }),
    );
  },
);
