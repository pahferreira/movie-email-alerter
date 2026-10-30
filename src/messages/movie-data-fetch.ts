import { eventType } from "inngest";
import { z } from "zod";

export const movieDataFetchSchema = z.object({
  movie_title: z.string().min(1),
});

export type MovieDataFetch = z.infer<typeof movieDataFetchSchema>;

export const movieDataFetch = eventType("meadow_api/movie-data.fetch", {
  schema: movieDataFetchSchema,
});

export type MovieData = {
  title: string;
  year: string;
  plot: string | null;
};
