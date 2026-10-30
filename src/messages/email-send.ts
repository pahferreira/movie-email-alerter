import { eventType } from "inngest";
import { z } from "zod";
import { movieDataSchema } from "./movie-data-fetch.js";

export const emailSendSchema = z.object({
  recipient_email: z.email(),
  movie: movieDataSchema,
});

export type EmailSend = z.infer<typeof emailSendSchema>;

export const emailSend = eventType("meadow_api/email.send", {
  schema: emailSendSchema,
});
