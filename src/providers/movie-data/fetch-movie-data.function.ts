import { config } from "../../config.js";
import { inngest } from "../../inngest/client.js";
import {
  movieDataFetch,
  movieDataFetchFailed,
  movieDataFetchSchema,
} from "../../messages/movie-data-fetch.js";
import type { MovieDataProvider } from "./movie-data-provider.js";
import { OmdbMovieDataProvider } from "./omdb.js";

const provider: MovieDataProvider = new OmdbMovieDataProvider(config.OMDB_API_KEY);

export const fetchMovieData = inngest.createFunction(
  {
    id: "fetch-movie-data",
    triggers: [movieDataFetch],
    retries: 4,
    concurrency: { limit: 5 },
    onFailure: async ({ event, error, step }) => {
      await step.sendEvent(
        "emit-fetch-failed",
        movieDataFetchFailed.create({
          request: movieDataFetchSchema.parse(event.data.event.data),
          error: { name: error.name, message: error.message },
        }),
      );
    },
  },
  async ({ event, step }) => {
    return step.run("omdb-lookup", () =>
      provider.fetchByTitle(event.data.movie_title),
    );
  },
);
