# Known limitations

What is not done, what is risky, and what to do about it. Ordered by how much it matters.

## Against the brief

| Gap | Detail | Remedy |
|---|---|---|
| **Profile photo upload** | A profile has a photo *address*, not an uploaded file. An upload was built and removed because the change was too large | Add an upload route (size and type checks), store the file (disk volume or object storage), serve it, keep `photoUrl` as the result |

## Data can be lost or wrong

| Gap | Impact | Remedy |
|---|---|---|
| **No outbox for events** | A profile change made while RabbitMQ is down is saved but never logged and never shown to admins. Nobody is told | Write the event to an `outbox` table in the same transaction as the change, and let a worker publish it |
| **A half-undone "add employee"** | If the undo fails too (see [decisions.md](decisions.md) 3), a profile or login may stay behind. It is logged with the id | A periodic job that finds profiles without a login and the other way round |
| **Admin edits are not events** | Only changes made by the employee are logged and announced. A change made by an admin to an employee leaves no trace | Publish `profile.changed` from the admin update too, with `changedBy` the admin |

## Security

| Gap | Impact | Remedy |
|---|---|---|
| **No way to revoke a token** | A switched-off employee can use the token they already have until it expires (up to 1 hour). A stolen token cannot be cancelled | Short tokens with refresh tokens kept in the database, or a deny list checked by the gateway |
| **No limit on login attempts** | Passwords can be guessed as fast as the server answers | Rate limiting at the gateway (for example `@nestjs/throttler`), stricter on `/auth/login` |
| **The documentation page is open** | `/docs` and `/docs-json` show every route to anybody who can reach the gateway | Turn it off outside development, or put it behind a login |
| **Services trust the network** | Anybody who can reach a service port can claim any identity with two headers | Keep the ports unpublished (done today), or add mutual TLS or a signed internal token |
| **Tokens are in `sessionStorage`** | An XSS bug could read them | See [decisions.md](decisions.md) 13 |
| **No password reset** | A forgotten password needs an admin or a database change. There is no email | A reset flow with a mail service |
| **Development defaults** | `.env.example` holds development passwords and the seed has known accounts | Replace every value and never seed in production (the seed refuses when `NODE_ENV=production`) |

## Behavior

| Gap | Detail |
|---|---|
| **Shifts across midnight** | A working day ends at 00:00 Jakarta time. Clocking in at 23:50 and out at 00:10 is refused (422). There is a test that records this |
| **One time zone** | The working day is fixed to Asia/Jakarta for everybody |
| **Notifications are polled** | Up to 15 seconds late (see [decisions.md](decisions.md) 7) |
| **No edit or correction of attendance** | A forgotten clock out cannot be fixed by an admin. The summary shows the day with no duration. The HR list is read only by requirement |
| **Fixed limits** | At most 366 days per attendance query and 100 rows per page |

## Operations

| Gap | Detail |
|---|---|
| **The frontend is not in Docker Compose** | A `Dockerfile` exists but is not wired in. Run it with `npm run dev` |
| **No CI** | Nothing runs the tests on a push |
| **No monitoring** | Health checks only test that a port answers (`/` routes were removed). There are no metrics, no tracing and no log collection |
| **No key rotation** | One key pair, no key id in the token |
| **No backups** | The database lives in a Docker volume. `docker compose down -v` deletes it |

## Tests

| Gap | Detail |
|---|---|
| **The log service has no tests** | Events becoming logs and notifications, retries, the dead queue and duplicates are the least covered part and the one that gave the most trouble |
| **No end-to-end test** over the whole stack | The flows across services are only tested one service at a time |
| **No frontend tests** | |
| **Swagger text is a copy** | A test checks that every route is documented and the padlocks are right. It cannot check that the *texts* still match what a service does |

## Small things in the code

- `frontend/app/lib/dummy-data.ts` is a leftover of the first mock-up. Only a type from it is still imported.
- Validation options are repeated in each service's `setup-app.ts`. They could move to one shared place.
- The helper `wholeNumber` (a number from a query string) is copied in the employee, attendance and log services.
