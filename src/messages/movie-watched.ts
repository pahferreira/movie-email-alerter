import { eventType } from "inngest";
import { z } from "zod";

export const movieWatchedSchema = z.object({
  movie_title: z.string().max(200).regex(/\S/, "Must not be blank"),
  recipient_email: z.email(),
});

export type MovieWatched = z.infer<typeof movieWatchedSchema>;

export const movieWatched = eventType("meadow_api/movie.watched", {
  schema: movieWatchedSchema,
});
