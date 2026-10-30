import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { inngest } from "../inngest/client.js";
import { movieWatched, movieWatchedSchema } from "../messages/movie-watched.js";

export const moviesRoutes: FastifyPluginAsync = async (app) => {
  app.post("/movies/watched", async (request, reply) => {
    const parsed = movieWatchedSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ errors: z.flattenError(parsed.error).fieldErrors });
    }

    const { ids } = await inngest.send(movieWatched.create(parsed.data));
    return reply.code(202).send({ eventId: ids[0] });
  });
};
