import type { MovieData } from "../../messages/movie-data-fetch.js";

export interface MovieDataProvider {
  fetchByTitle(title: string): Promise<MovieData>;
}
