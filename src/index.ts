import Fastify from "fastify";
import inngestFastify from "inngest/fastify";
import { config } from "./config.js";
import { movieWatchedFn } from "./core/movie-watched.function.js";
import { moviesRoutes } from "./http/movies.routes.js";
import { inngest } from "./inngest/client.js";
import { sendEmail } from "./providers/email/send-email.function.js";
import { fetchMovieData } from "./providers/movie-data/fetch-movie-data.function.js";

const app = Fastify({ logger: true });

app.register(inngestFastify, {
  client: inngest,
  functions: [movieWatchedFn, fetchMovieData, sendEmail],
});
app.register(moviesRoutes);

await app.listen({ port: config.PORT });
