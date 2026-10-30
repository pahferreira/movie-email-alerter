import { inngest } from "../inngest/client.js";
import { movieWatched } from "../messages/movie-watched.js";
import { fetchMovieData } from "../providers/movie-data/fetch-movie-data.function.js";

export const movieWatchedFn = inngest.createFunction(
  { id: "movie-watched", triggers: [movieWatched] },
  async ({ event, step }) => {
    const movie = await step.invoke("fetch-movie-data", {
      function: fetchMovieData,
      data: { movie_title: event.data.movie_title },
    });

    return { movie };
  },
);
