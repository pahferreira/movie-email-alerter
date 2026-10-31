import { NonRetriableError } from "inngest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OmdbMovieDataProvider } from "./omdb.js";

const provider = new OmdbMovieDataProvider("test-key");

function stubFetch(status: number, body: unknown = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })),
  );
}

async function expectRetryable(promise: Promise<unknown>) {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(Error);
  expect(error).not.toBeInstanceOf(NonRetriableError);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OmdbMovieDataProvider", () => {
  it("maps a found movie", async () => {
    stubFetch(200, {
      Response: "True",
      Title: "The Matrix",
      Year: "1999",
      Plot: "A hacker learns the truth about reality.",
    });

    await expect(provider.fetchByTitle("The Matrix")).resolves.toEqual({
      title: "The Matrix",
      year: "1999",
      plot: "A hacker learns the truth about reality.",
    });
  });

  it("turns Plot N/A into null", async () => {
    stubFetch(200, {
      Response: "True",
      Title: "The Matrix",
      Year: "1999",
      Plot: "N/A",
    });

    await expect(provider.fetchByTitle("The Matrix")).resolves.toEqual({
      title: "The Matrix",
      year: "1999",
      plot: null,
    });
  });

  it('fails permanently on Response "False"', async () => {
    stubFetch(200, { Response: "False", Error: "Movie not found!" });

    await expect(provider.fetchByTitle("Nope")).rejects.toBeInstanceOf(
      NonRetriableError,
    );
  });

  it.each([401, 404])("fails permanently on %i", async (status) => {
    stubFetch(status);

    await expect(provider.fetchByTitle("The Matrix")).rejects.toBeInstanceOf(
      NonRetriableError,
    );
  });

  it.each([500, 429])("fails retryably on %i", async (status) => {
    stubFetch(status);

    await expectRetryable(provider.fetchByTitle("The Matrix"));
  });

  it.each([
    ["network error", new TypeError("fetch failed")],
    ["timeout", new DOMException("The operation timed out.", "TimeoutError")],
  ])("fails retryably on %s", async (_, rejection) => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(rejection));

    await expectRetryable(provider.fetchByTitle("The Matrix"));
  });
});
