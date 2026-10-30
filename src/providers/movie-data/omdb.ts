import { NonRetriableError } from "inngest";
import type { MovieData } from "../../messages/movie-data-fetch.js";
import type { MovieDataProvider } from "./movie-data-provider.js";

const OMDB_URL = "https://www.omdbapi.com/";
const TIMEOUT_MS = 10_000;

type OmdbResponse =
  | { Response: "True"; Title: string; Year: string; Plot: string }
  | { Response: "False"; Error: string };

export class OmdbMovieDataProvider implements MovieDataProvider {
  constructor(private readonly apiKey: string) {}

  async fetchByTitle(title: string): Promise<MovieData> {
    const url = new URL(OMDB_URL);
    url.searchParams.set("apikey", this.apiKey);
    url.searchParams.set("t", title);
    url.searchParams.set("plot", "short");

    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) {
      const message = `OMDb request failed with status ${res.status}`;
      // 5xx and 429 are transient; any other 4xx (e.g. 401 bad key) won't fix itself.
      if (res.status >= 500 || res.status === 429) throw new Error(message);
      throw new NonRetriableError(message);
    }

    const body = (await res.json()) as OmdbResponse;
    if (body.Response === "False") {
      throw new NonRetriableError(`OMDb lookup failed: ${body.Error}`);
    }

    return {
      title: body.Title,
      year: body.Year,
      plot: body.Plot === "N/A" ? null : body.Plot,
    };
  }
}
