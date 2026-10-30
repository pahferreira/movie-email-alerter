import type { MovieData } from "../../messages/movie-data-fetch.js";

const NO_PLOT = "No plot summary available.";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export function renderMovieEmail(movie: MovieData) {
  const heading = `${movie.title} (${movie.year})`;
  const plot = movie.plot ?? NO_PLOT;

  return {
    subject: `Plot summary: ${heading}`,
    html: `<h1>${escapeHtml(heading)}</h1>\n<p>${escapeHtml(plot)}</p>`,
    text: `${heading}\n\n${plot}`,
  };
}
