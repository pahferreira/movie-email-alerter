import { NonRetriableError } from "inngest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResendEmailProvider } from "./resend.js";

const send = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

const provider = new ResendEmailProvider("test-key", "from@example.com");
const email = {
  to: "to@example.com",
  subject: "Plot summary: The Matrix (1999)",
  html: "<p>plot</p>",
  text: "plot",
};

function resendError(statusCode: number | null, name: string) {
  send.mockResolvedValue({
    data: null,
    error: { statusCode, name, message: "boom" },
  });
}

beforeEach(() => {
  send.mockReset();
});

describe("ResendEmailProvider", () => {
  it("returns the email id and forwards the idempotency key", async () => {
    send.mockResolvedValue({ data: { id: "email_123" }, error: null });

    await expect(provider.send(email, "movie-watched/evt_1")).resolves.toEqual({
      id: "email_123",
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ from: "from@example.com", to: email.to }),
      { idempotencyKey: "movie-watched/evt_1" },
    );
  });

  it.each([
    [422, "validation_error"],
    [409, "invalid_idempotent_request"],
  ])("fails permanently on %i %s", async (status, name) => {
    resendError(status, name);

    await expect(provider.send(email)).rejects.toBeInstanceOf(NonRetriableError);
  });

  it.each([
    [429, "rate_limit_exceeded"],
    [500, "internal_server_error"],
    [null, "application_error"],
    [409, "concurrent_idempotent_requests"],
  ])("fails retryably on %s %s", async (status, name) => {
    resendError(status, name);

    const error = await provider.send(email).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(NonRetriableError);
  });
});
