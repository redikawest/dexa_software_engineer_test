# Decisions

The choices that shaped the system, each with the reason and the price. They are written down so that a later change is a conscious one.

## 1. Several small services behind one gateway

**Decision.** An API gateway and four NestJS services (auth, employee, attendance, log), in one repository.
**Why.** The brief asks for a microservice backend. Each service owns one thing and can be changed, tested and run on its own. The gateway is the only door, so there is one place for tokens, roles, CORS and documentation.
**Price.** Flows that touch two services cannot use a database transaction (see 3). More moving parts to run: Docker Compose does that.

## 2. One owner per table, no foreign keys across services

**Decision.** A table is read and written by one service only. Others ask through its API. A reference to another service's row (`attendance_records.employee_id`) has no foreign key.
**Why.** Otherwise the services would share a schema and could not change independently.
**Price.** The database no longer checks those references. The services must. Names for the HR attendance list are fetched from the employee service, and shown empty if that fails.

## 3. A saga with an undo for "add employee"

**Decision.** The employee service saves the profile, then asks the auth service for the login, and removes the profile if that fails. The internal routes of the auth service can be repeated safely.
**Why.** There is no transaction across two services, and the order "profile first" makes the undo simple.
**Price.** If the undo itself fails (the auth service dies at the wrong moment), an orphan row can stay. The service logs "Clean it up by hand" with the id. The rarer case is accepted over adding a workflow engine.

## 4. RS256 tokens with split keys

**Decision.** Tokens are signed with a private key that only the auth service holds. The gateway verifies with the public key.
**Why.** The gateway can check a token without calling auth (so the system keeps working when auth is down), and a compromise of the gateway cannot make tokens.
**Price.** Key files must be created and mounted. There is no key rotation yet.

## 5. Services trust identity headers from the gateway

**Decision.** After verifying the token the gateway passes `x-user-id` and `x-user-role`. The services do not see a token.
**Why.** One place verifies tokens. The services stay simple.
**Price.** The safety depends on the services being unreachable from outside. See [security.md](security.md).

## 6. Events through RabbitMQ for the profile log and the notifications

**Decision.** A change publishes `profile.changed`. Two queues each get a copy: one writes the audit log, one makes the notification. The log lives in a separate database.
**Why.** The brief asks for a message queue and a separate log database. Two queues mean one slow or failing consumer does not hold up the other. At-least-once delivery with a unique `event_id` makes duplicates harmless.
**Price.** Publishing is fire and forget, so a change made while RabbitMQ is down is never logged. The remedy, an outbox table, is on the list in [known-limitations.md](known-limitations.md).

## 7. Notifications by polling

**Decision.** The admin page asks for notifications every 15 seconds.
**Why.** It is simple, works through any proxy, and needs no open connection per admin.
**Price.** Up to 15 seconds of delay, and a steady trickle of requests. WebSocket or server-sent events would fix both.

## 8. Hand-written migrations, never `synchronize`

**Decision.** Tables are made by SQL migrations that run before the services start. Services never change the schema.
**Why.** The schema is reviewed in code, runs the same everywhere, and a service cannot damage it by starting with a wrong entity.
**Price.** A new migration must be added to a list by hand.

## 9. Attendance as one row per event, with a unique rule

**Decision.** A clock in and a clock out are separate rows. `UNIQUE (employee_id, work_date, type)` enforces "once a day". The time is taken by the server, and the day is a Jakarta day.
**Why.** The database settles a double click or two devices at once, with no locking code. A client cannot send a false time.
**Price.** A working day ends at midnight Jakarta time: a shift that crosses midnight is not supported (a clock out after midnight finds no clock in for the new day).

## 10. Validation in the services, types in the gateway

**Decision.** Request bodies and queries are classes with `class-validator` rules in the service that owns the rule. The gateway only types them.
**Why.** One place decides what is valid, next to the logic that needs it, and a service called by another service is protected too. The gateway stays a thin pass-through.
**Price.** The Swagger text in the gateway repeats some rules (`minLength: 8`) and has to be kept in step by hand. A shared contracts library would remove that, at the cost of more structure. It was tried and dropped for being too large for the gain.

## 11. Swagger at the gateway only

**Decision.** One documentation page, at the gateway.
**Why.** The gateway is the only address a client can reach, so it is the only contract that matters. The internal routes are listed in [api.md](api.md).
**Price.** See 10. The page is open without a token (see known-limitations).

## 12. A photo address instead of an upload

**Decision.** A profile has a `photoUrl`. There is no file upload.
**Why.** Upload needs storage, size and type checks, and serving the files. It was started and removed because the change was too large for the brief's other parts.
**Price.** The requirement "profile photo" is only partly met. See [known-limitations.md](known-limitations.md).

## 13. The token lives in `sessionStorage`

**Decision.** The browser keeps the session in `sessionStorage`.
**Why.** It is gone when the tab closes, and needs no cookie settings or CSRF protection.
**Price.** A script injected into the page (XSS) could read it. An httpOnly cookie would resist that but needs CSRF handling and same-site hosting.

## 14. Real databases in integration tests, fakes only at the edges

**Decision.** Integration tests run against PostgreSQL (`dexa_test`, made and dropped per run) and replace only other services and the broker.
**Why.** Constraints, SQL and transactions are where the real bugs were. A fake database would not have found them. See [testing.md](testing.md).
**Price.** The tests need Docker running and take a few seconds longer.
