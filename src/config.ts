import { z } from "zod";

const envSchema = z.object({
  OMDB_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  INNGEST_DEV: z.stringbool().default(false),
  PORT: z.coerce.number().int().positive().default(3000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment configuration:\n" + z.prettifyError(parsed.error),
  );
  process.exit(1);
}

export const config = parsed.data;
