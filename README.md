# Movie Email Alerter

An Inngest workflow that, on `meadow_api/movie.watched`, fetches the movie from [OMDb](https://www.omdbapi.com/) and emails its plot summary via [Resend](https://resend.com/).

Built with Node.js (TypeScript), Fastify, Inngest and Zod.

## Setup

Requires Node.js 20.6+ (for `--env-file`).

```sh
npm install
cp .env.example .env   # fill in the keys
npm run dev            # app on http://localhost:3000
npm run dev:inngest    # Inngest dev server on http://localhost:8288 (separate terminal)
```

### Environment

Validated with Zod at startup; the app exits with a list of problems if anything is missing.

| Variable | Required | Description |
|---|---|---|
| `OMDB_API_KEY` | yes | OMDb API key |
| `RESEND_API_KEY` | yes | Resend API key |
| `EMAIL_FROM` | yes | Sender address. Must be on a domain verified in Resend (`onboarding@resend.dev` only delivers to your own account address) |
| `INNGEST_DEV` | yes, set to `true` | Runs against the local Inngest dev server. The project is meant to run in dev mode only |
| `PORT` | no (default `3000`) | HTTP port |

## Usage

```sh
curl -i -X POST http://localhost:3000/movies/watched \
  -H 'Content-Type: application/json' \
  -d '{"movie_title": "The Matrix", "recipient_email": "you@example.com"}'
```

- `202 { "eventId": "..." }`: the event was accepted; the work runs asynchronously.
- `400 { "errors": { ... } }`: invalid input (empty or over-long title, invalid email).

You can also send the event straight from the dev server UI (**Events → Send event**):

```json
{
  "name": "meadow_api/movie.watched",
  "data": { "movie_title": "The Matrix", "recipient_email": "you@example.com" }
}
```

## Architecture

```
POST /movies/watched ──► meadow_api/movie.watched
                              │
                              ▼
                     Core: movie-watched  (retries: 0)
                     ├─ step.invoke ──► fetch-movie-data  ──► OMDb
                     │                   onFailure ──► meadow_api/movie-data.fetch-failed
                     └─ step.invoke ──► send-email        ──► Resend
                                         onFailure ──► meadow_api/email.send-failed
```

### Reliability choices

- **Retries live in the children, not Core.** Core has `retries: 0`; otherwise retries multiply (Core × child).
  - `fetch-movie-data`: `retries: 4`, `concurrency: { limit: 5 }`.
  - `send-email`: `retries: 10`, `throttle: { limit: 2, period: "1s" }` (Resend's default rate limit).
- **Error classification** decides retry vs. dead-letter:
  - Permanent (`NonRetriableError`, no retries): OMDb "movie not found" / bad key, OMDb 4xx, Resend 4xx (bad key, unverified sender, invalid recipient, idempotency key reused with a different payload).
  - Transient (retried): network errors, timeouts, 5xx, 429, Resend errors with no status code, and Resend 409 `concurrent_idempotent_requests`.
- **Retry-safe sends.** Each email is sent with a Resend idempotency key, `movie-watched/<event id>`. If `send-email` retries after Resend already accepted the email (e.g. a lost response), Resend returns the original email instead of sending a second one. `send-email` falls back to its own event id when invoked without a key.
- **Missing plot.** If OMDb has no plot (`"N/A"`), the email is still sent with "No plot summary available."

## Manual verification

Run both `npm run dev` and `npm run dev:inngest`, then watch runs at http://localhost:8288.

| Scenario | How | Expected |
|---|---|---|
| Happy path | POST "The Matrix" with your email | `202`; `movie-watched` invokes `fetch-movie-data` then `send-email`, returns `{ emailId }`; email arrives |
| Invalid input | POST with `"recipient_email": "nope"` | `400` with field errors; no event sent |
| Movie not found | POST a nonsense title | `fetch-movie-data` fails once (no retries), `meadow_api/movie-data.fetch-failed` is emitted, Core fails and logs |
| Email failure | Set `EMAIL_FROM` to an unverified domain, restart, POST | `send-email` fails once (no retries), `meadow_api/email.send-failed` is emitted |
| Idempotent resend | Send the same `meadow_api/email.send` event (same `idempotency_key`) twice to the dev server | Both `send-email` runs return the same email id; only one email arrives. The Resend logs show the key on the request |
| Repeat viewing | POST the same payload twice | Two emails: two events are two viewings |

### Commands

Set your address once, then copy any block below.

```sh
EMAIL=you@example.com
```

<details>
<summary>Happy path</summary>

```sh
curl -i -X POST http://localhost:3000/movies/watched \
  -H 'Content-Type: application/json' \
  -d "{\"movie_title\": \"The Matrix\", \"recipient_email\": \"$EMAIL\"}"
```

</details>

<details>
<summary>Invalid input</summary>

```sh
curl -i -X POST http://localhost:3000/movies/watched \
  -H 'Content-Type: application/json' \
  -d '{"movie_title": "The Matrix", "recipient_email": "nope"}'
```

</details>

<details>
<summary>Movie not found</summary>

```sh
curl -i -X POST http://localhost:3000/movies/watched \
  -H 'Content-Type: application/json' \
  -d "{\"movie_title\": \"zzqx no such movie 9271\", \"recipient_email\": \"$EMAIL\"}"
```

</details>

<details>
<summary>Email failure</summary>

Restart the app with an unverified sender (shell variables take precedence over `.env`):

```sh
EMAIL_FROM=alerts@unverified-domain.example npm run dev
```

Then, in another terminal:

```sh
curl -i -X POST http://localhost:3000/movies/watched \
  -H 'Content-Type: application/json' \
  -d "{\"movie_title\": \"The Matrix\", \"recipient_email\": \"$EMAIL\"}"
```

Restart with plain `npm run dev` afterwards.

</details>

<details>
<summary>Idempotent resend</summary>

Sends the same `email.send` event twice straight to the dev server's event API (any event key works in dev). Run the block as a whole so both requests share the key:

```sh
KEY="manual-test-$(date +%s)"
for i in 1 2; do
  curl -i -X POST http://localhost:8288/e/dev \
    -H 'Content-Type: application/json' \
    -d "{\"name\": \"meadow_api/email.send\", \"data\": {\"recipient_email\": \"$EMAIL\", \"movie\": {\"title\": \"The Matrix\", \"year\": \"1999\", \"plot\": \"Idempotency test\"}, \"idempotency_key\": \"$KEY\"}}"
done
```

Resend keeps idempotency keys for 24 hours. Reusing a key with a different payload returns `invalid_idempotent_request`, which fails permanently and emits `meadow_api/email.send-failed`.

</details>

<details>
<summary>Repeat viewing</summary>

```sh
for i in 1 2; do
  curl -i -X POST http://localhost:3000/movies/watched \
    -H 'Content-Type: application/json' \
    -d "{\"movie_title\": \"The Matrix\", \"recipient_email\": \"$EMAIL\"}"
done
```

</details>

## Assumptions

- Each `movie.watched` event is a distinct viewing; re-POSTing the same payload sends again by design. Idempotency protects against duplicate sends from retries, not against repeat events.
- OMDb `t=` returns its best match for the title.
- Sending to arbitrary recipients requires a verified Resend domain (`EMAIL_FROM`).

## Enhancements

1. **Provider fallback chain**: adapters already exist; add a secondary `EmailProvider` and try it when the primary fails permanently.
2. **429 handling with `RetryAfterError`**: honor the provider's `Retry-After` instead of default backoff; error classification is already in place.
3. **Bounce/delivery webhooks**: instead of verifying an email exists up front (unreliable), ingest Resend `email.bounced` / `email.delivered` webhooks as Inngest events to track real delivery and suppress bad addresses.
4. **Business-level dedupe / repeat viewings**: persist `(email, title, watched_at)`, normalize inputs (trim, lowercase, collapse whitespace), and opt into Inngest `idempotency` with a CEL key; a viewing ID in the key would still allow intentional re-watches.
5. **OMDb quota throttle + `year` disambiguation**: throttle against the free tier's 1,000 requests/day; accept an optional `year` in the event to pick the right film.
6. **Function-flow tests with `@inngest/test`**: cover the orchestration (invoke chain, `onFailure` emitting `*-failed` events).
7. **DLQ consumer**: a function listening to `*-failed` events that stores and/or alerts, enabling bulk replay.

## Recommendation for the exercise

Resend's default sender (`onboarding@resend.dev`) can only deliver to the account owner's address, so sending to an arbitrary `recipient_email` needs a verified domain. Providing a test recipient or a sandbox setup would remove that friction.
