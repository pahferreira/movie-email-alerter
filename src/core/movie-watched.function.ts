import { inngest } from "../inngest/client.js";
import { movieWatched } from "../messages/movie-watched.js";
import { sendEmail } from "../providers/email/send-email.function.js";
import { fetchMovieData } from "../providers/movie-data/fetch-movie-data.function.js";

export const movieWatchedFn = inngest.createFunction(
  {
    id: "movie-watched",
    triggers: [movieWatched],
    // Children own their retries; retrying here would multiply them.
    retries: 0,
    onFailure: async ({ event, error, logger }) => {
      logger.error("movie-watched failed", {
        runId: event.data.run_id,
        movieTitle: event.data.event.data.movie_title,
        error: error.message,
      });
    },
  },
  async ({ event, step }) => {
    const movie = await step.invoke("fetch-movie-data", {
      function: fetchMovieData,
      data: { movie_title: event.data.movie_title },
    });

    const sentEmail = await step.invoke("send-email", {
      function: sendEmail,
      data: {
        recipient_email: event.data.recipient_email,
        movie,
        idempotency_key: `movie-watched/${event.id}`,
      },
    });

    return { emailId: sentEmail.id };
  },
);
