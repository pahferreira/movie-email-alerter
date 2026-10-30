import { eventType } from "inngest";
import { z } from "zod";

export const movieDataFetchSchema = z.object({
  movie_title: z.string().min(1),
});

export type MovieDataFetch = z.infer<typeof movieDataFetchSchema>;

export const movieDataFetch = eventType("meadow_api/movie-data.fetch", {
  schema: movieDataFetchSchema,
});

export const movieDataSchema = z.object({
  title: z.string(),
  year: z.string(),
  plot: z.string().nullable(),
});

export type MovieData = z.infer<typeof movieDataSchema>;

export const movieDataFetchFailedSchema = z.object({
  request: movieDataFetchSchema,
  error: z.object({ name: z.string(), message: z.string() }),
});

export type MovieDataFetchFailed = z.infer<typeof movieDataFetchFailedSchema>;

export const movieDataFetchFailed = eventType(
  "meadow_api/movie-data.fetch-failed",
  { schema: movieDataFetchFailedSchema },
);
