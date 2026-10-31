import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { inngest } from "../inngest/client.js";
import { movieWatched, movieWatchedSchema } from "../messages/movie-watched.js";

// eventType schemas reject transforms, so trimming happens on the HTTP input only.
const movieWatchedBodySchema = z.object({
  movie_title: z.string().trim().pipe(movieWatchedSchema.shape.movie_title),
  recipient_email: z.string().trim().pipe(movieWatchedSchema.shape.recipient_email),
});

export const moviesRoutes: FastifyPluginAsync = async (app) => {
  app.post("/movies/watched", async (request, reply) => {
    const parsed = movieWatchedBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ errors: z.flattenError(parsed.error).fieldErrors });
    }

    const { ids } = await inngest.send(movieWatched.create(parsed.data));
    return reply.code(202).send({ eventId: ids[0] });
  });
};
