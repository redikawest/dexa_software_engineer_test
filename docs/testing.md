# Testing

Two kinds of backend tests, with different jobs. Both use [Vitest](https://vitest.dev).

| | Unit tests | Integration tests |
|---|---|---|
| Question | Is this piece of logic right? | Do the pieces work together, over HTTP, with a real database? |
| Where | Next to the code: `src/**/*.spec.ts` | `apps/<service>/test/*.e2e-spec.ts` |
| Database | None. Fakes replace it | A real PostgreSQL database made for the run |
| Speed | Under a second | A few seconds |
| Finds | Wrong calculations, wrong order of steps, what is undone after a failure | Wrong wiring: validation, guards, SQL, constraints, status codes |

Most of the bugs found while building this were of the second kind (a data copy that overwrote a field with `undefined`, an order of decorators that gave the wrong message, a foreign key that caused a 500). That is why every service has integration tests, and unit tests are kept for logic that has no database in it.

## Running

From `backend/`:

```bash
npm test                      # all unit tests
npm run test:e2e              # all integration tests
npm run test:watch            # unit tests, run again on every change

# one service
npx vitest run apps/attendance-service
npx vitest run --config ./vitest.config.e2e.ts apps/attendance-service

# the name of every test, not just the total
npx vitest run apps/api-gateway --reporter=verbose
```

Integration tests need:

- the PostgreSQL container running (`docker compose up -d postgres`)
- `backend/.env` (they read the database host and user from it)
- the JWT keys (`npm run keys:generate`), for the auth service tests. The gateway tests make their own keys

They do **not** touch `dexa_main`. Before the run a database `dexa_test` is created and migrated with the real migrations, and after the run it is dropped. If a run was killed half way, the next run drops the old one first.

## What is covered

| Part | Unit | Integration | Covers |
|---|---|---|---|
| Auth service | yes | yes | Login, change password, the internal login routes, the event on a password change |
| Employee service | yes | yes | Profile, add employee and its undo steps, change and switch on or off, list and search, the event on a profile change |
| Attendance service | yes | yes | Clock in and out rules, the working day in Jakarta time, summary maths, the HR list |
| API gateway | yes | yes | Token checks, the role of every route, forwarding, errors, the documentation, CORS |
| Log service | no | no | **Not written yet** (events becoming logs and notifications, retries, duplicates) |
| Frontend | no | no | |

## How the integration tests are built

```
backend/
├── vitest.config.ts          unit: **/*.spec.ts
├── vitest.config.e2e.ts      integration: **/*.e2e-spec.ts, one file after another
├── test/
│   ├── global-setup.ts       creates and migrates dexa_test before, drops it after
│   ├── env.ts, setup-env.ts  loads .env but forces DB_NAME=dexa_test
│   └── aliases.ts            the @app/* aliases, read from tsconfig.json
└── apps/<service>/
    ├── src/setup-app.ts      configureApp(app): the pipes (and for the gateway CORS and Swagger),
    │                         used by main.ts AND the tests, so tests run the app as it really runs
    └── test/*.e2e-spec.ts
```

What is real and what is a stand-in:

| Test | Real | Replaced |
|---|---|---|
| Auth | HTTP, validation, service, database, JWT | RabbitMQ (a recorder of the events) |
| Employee | HTTP, validation, service, database | The auth service (a fake that can be told "down") and RabbitMQ |
| Attendance | HTTP, validation, service, database | The employee service (names), and the **clock** (only `Date`, fixed at 9 October 2026) |
| Gateway | The gateway itself, with its guards | The four services behind it: small HTTP servers that write down what they receive. The key pair is made by the test |

A stand-in is used when the real thing is another service (we test one service at a time) or when it is impossible to make fail on purpose (a broker or a service that is down).

## Writing a test

1. **Unit test** for logic: build the class by hand with fakes (`vi.fn()`), as in `employee-service.service.spec.ts`. Test the order of steps and what is undone.
2. **Integration test** for a route: start the module with `Test.createTestingModule`, replace only what must be replaced with `overrideProvider`, call `configureApp(app)`, and use `supertest`. Empty the tables in `beforeEach`.
3. Name the test as a sentence about behavior ("refuses a wrong current password and keeps the old one"), not the method.
4. Assert what must **not** happen too: that nothing was saved, no event was sent, no service was called.
5. When a test passes the first time, break the code on purpose and see it fail. A test that cannot fail proves nothing. (This was done for every test file here, and it showed which tests only a unit test or only an integration test can catch.)

## Pitfalls

- **Decorators.** Vite 8 does not understand Nest's decorators by itself. Both Vitest configs switch them on (`oxc: { decorator: { legacy: true, emitDecoratorMetadata: true } }`). Without it even a class with `@Injectable()` cannot be loaded.
- **Aliases.** `tsconfig.json` only refers to the app projects, and those leave out spec files, so Vite's own path support finds nothing for tests. That is why `test/aliases.ts` exists.
- **Importing `@app/config` loads the configuration at once.** Its index file creates the `ConfigModule` as soon as it is imported. A test that must set its own environment (the gateway tests) imports the app module only after setting it, and takes constants from the file itself (`@app/config/auth-context.js`).
- **Time.** Use `vi.useFakeTimers({ toFake: ['Date'] })`. Faking everything freezes timers the database driver needs.
- **A crashed run** leaves `dexa_test` behind. The next run drops it first. `dexa_main` is never touched.

## Not tested (by design or for now)

- The generated Swagger page itself is only checked as data (every route present, padlocks and codes right), not as a page.
- No test runs against the full Docker stack. The paths that cross several services (adding an employee end to end, a profile change becoming a notification) are tested one service at a time.
