# Getting started

## What you need

| Tool | Version | Why |
|---|---|---|
| Node.js | 22.22 or newer | The backend and the tests need it. An older Node fails with errors such as `Unexpected token 'with'` |
| npm | comes with Node | |
| Docker Desktop | recent | Runs PostgreSQL, RabbitMQ, the gateway and the four services |

## First run

From the repository root unless it says otherwise.

**1. Backend configuration and keys** (once)

```bash
cd backend
cp .env.example .env
npm install
npm run keys:generate        # creates keys/jwt-private.pem and keys/jwt-public.pem
cd ..
```

`.env.example` holds development defaults only. The keys are ignored by git and are mounted into the containers: the private key into the auth service, the public key into the gateway.

**2. Start everything**

```bash
docker compose up -d --build
docker compose ps            # wait until every service says "healthy"
```

The `migrate` container runs first and exits: it creates the tables of both databases. The services start after it has finished.

**3. Put development data in the database** (once)

```bash
cd backend
npm run seed
```

The seed adds one HR admin and six employees. It is safe to run again: existing rows are skipped and passwords are never overwritten. It refuses to run when `NODE_ENV=production`.

**4. Start the frontend**

```bash
cd frontend
cp .env.example .env         # VITE_API_URL points at the gateway
npm install
npm run dev
```

## Where things are

| What | Address |
|---|---|
| Frontend | http://localhost:5173 |
| API gateway (the only service reachable from outside) | http://localhost:3000 |
| API documentation (Swagger UI) | http://localhost:3000/docs |
| OpenAPI file | http://localhost:3000/docs-json |
| RabbitMQ management | http://localhost:15672 (only from this machine) |
| PostgreSQL | localhost:5432 |

The four other services (auth 3001, employee 3002, attendance 3003, log 3004) only live inside the Docker network on purpose. See [architecture.md](architecture.md).

## Accounts

The seed creates these logins. The passwords come from `backend/.env`: `SEED_ADMIN_PASSWORD` for the admin and `SEED_EMPLOYEE_PASSWORD` for the employees.

| Role | Email | Log in at |
|---|---|---|
| HR admin | `hr.admin@company.com` | `/admin/login` |
| Employee | `budi.santoso@company.com`, `andi.pratama@company.com`, `dewi.lestari@company.com`, `rizky.hidayat@company.com`, `maya.putri@company.com`, `fajar.nugroho@company.com` | `/login` |

## Everyday commands

```bash
# After changing backend code, rebuild the service you changed
docker compose up -d --build employee-service

# Logs of one service
docker compose logs -f api-gateway

# Stop, keeping the data
docker compose down

# Stop and DELETE the databases (start over)
docker compose down -v
```

Tests are described in [testing.md](testing.md):

```bash
cd backend
npm test                     # unit tests
npm run test:e2e             # integration tests (needs the PostgreSQL container running)
```

## When something goes wrong

| Symptom | Likely cause and fix |
|---|---|
| `SyntaxError: Unexpected token 'with'` (or `'??='`) when running `npm` | Node is too old. Check `node -v`, then `nvm use 22` or put a newer Node first in `PATH` |
| `npm ERR! enoent ... package.json` | You are in the repository root. `cd backend` or `cd frontend` first |
| Browser shows a CORS error on login | The gateway container is older than the code. Run `docker compose up -d --build api-gateway`. Also check that `CORS_ORIGINS` contains the address of the frontend |
| A container stays `unhealthy` | Read its log: `docker compose logs <service>`. A missing key file or a wrong value in `.env` is the usual cause |
| `502 ... service is unreachable` from the gateway | That service is down or still starting. `docker compose ps` |
| Login works but the admin never sees notifications | The log service or RabbitMQ is down. Events wait in the queue and are handled when the service is back. See [events.md](events.md) |
| `npm run seed` fails with a connection error | PostgreSQL is not running, or `DB_HOST` in `backend/.env` is not `localhost` |
