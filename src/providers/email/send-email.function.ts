import { config } from "../../config.js";
import { inngest } from "../../inngest/client.js";
import {
  emailSend,
  emailSendFailed,
  emailSendSchema,
} from "../../messages/email-send.js";
import type { EmailProvider } from "./email-provider.js";
import { ResendEmailProvider } from "./resend.js";
import { renderMovieEmail } from "./template.js";

const provider: EmailProvider = new ResendEmailProvider(
  config.RESEND_API_KEY,
  config.EMAIL_FROM,
);

export const sendEmail = inngest.createFunction(
  {
    id: "send-email",
    triggers: [emailSend],
    retries: 10,
    // Resend's default rate limit is 2 requests per second.
    throttle: { limit: 2, period: "1s" },
    onFailure: async ({ event, error, step }) => {
      await step.sendEvent(
        "emit-send-failed",
        emailSendFailed.create({
          request: emailSendSchema.parse(event.data.event.data),
          error: { name: error.name, message: error.message },
        }),
      );
    },
  },
  async ({ event, step }) => {
    return step.run("resend-send", () =>
      provider.send({
        to: event.data.recipient_email,
        ...renderMovieEmail(event.data.movie),
      }),
    );
  },
);
