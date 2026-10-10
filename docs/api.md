# API

The reference for every route (parameters, request and response shapes, examples, error codes) is the live documentation generated from the code:

- **Swagger UI**: http://localhost:3000/docs (log in with `POST /auth/login`, copy the `accessToken`, press **Authorize**)
- **OpenAPI file**: http://localhost:3000/docs-json

This page holds what applies to every route and what Swagger cannot say well.

## Conventions

| Topic | Rule |
|---|---|
| Base address | The gateway, `http://localhost:3000`. Nothing else is reachable from outside |
| Format | JSON in, JSON out (`Content-Type: application/json`) |
| Authentication | `Authorization: Bearer <accessToken>` on every route except `POST /auth/login` |
| Who you are | Taken from the token only. Headers such as `x-user-id` sent by a client are ignored |
| Dates | A day is `YYYY-MM-DD`. Moments are ISO 8601 in UTC (`2026-10-09T08:00:00.000Z`) |
| Working day | A day in **Jakarta time** (UTC+7), not UTC. A clock in at 00:30 Jakarta time counts for the new day |
| Time of clock in and out | Taken by the server. The client cannot send it |
| Lists | `{ items, page, pageSize, total }`. `page` starts at 1. `total` counts all rows over all pages |

## Errors

Every error has the same shape:

```json
{ "statusCode": 400, "message": "Current password is incorrect", "error": "Bad Request" }
```

`message` is a text, or a **list of texts** when several fields are wrong (one text per field):

```json
{ "statusCode": 400, "message": ["name is required (at most 100 characters)", "email must be a valid email address"], "error": "Bad Request" }
```

| Status | Meaning here |
|---|---|
| 400 | A field is missing or not valid, or a rule was broken (for example "new password must differ") |
| 401 | No token, a bad or expired token, or a wrong email or password at login |
| 403 | The token is good but the role is not allowed (an employee calling an `/admin` route) |
| 404 | The employee (or the profile of the token) does not exist |
| 409 | Already exists: an email in use, a second clock in or clock out on the same day |
| 422 | Clock out without a clock in on that day |
| 502 | The gateway could not reach the service behind it. The message names the service, never its address |
| 503 | A service answered but a step it depends on is down (adding or switching off an employee while the auth service is down). Nothing was saved |

A wrong email and a wrong password at login give the **same** answer, so a caller cannot find out which emails exist.

## Routes

`any` means any logged-in user. `admin` means the role `HR_ADMIN`.

| Method and path | Access | Service | Purpose |
|---|---|---|---|
| `POST /auth/login` | public | auth | Log in, get a token |
| `PATCH /auth/password` | any | auth | Change my password |
| `GET /employee/me` | any | employee | My profile |
| `PATCH /employee/me` | any | employee | Change my phone or photo address |
| `GET /attendance/today` | any | attendance | My status today: `NOT_STARTED`, `WORKING` or `DONE` |
| `GET /attendance/summary` | any | attendance | My attendance over a period, with totals |
| `POST /attendance/clock-in` | any | attendance | Clock in (once a day) |
| `POST /attendance/clock-out` | any | attendance | Clock out (once a day, after clocking in) |
| `GET /admin/employees` | admin | employee | List employees, with search and pages |
| `POST /admin/employees` | admin | employee | Add an employee (profile and login together) |
| `GET /admin/employees/{id}` | admin | employee | One employee |
| `PATCH /admin/employees/{id}` | admin | employee | Change name, position, phone, or switch the account on or off |
| `GET /admin/attendance` | admin | attendance | Attendance of everybody, read only |
| `GET /admin/notifications` | admin | log | Profile changes made by employees, newest first |
| `POST /admin/notifications/seen` | admin | log | Mark notifications as seen |

Status codes of success: `200` for reads, changes, login and `notifications/seen`; `201` for `POST /admin/employees`, `clock-in` and `clock-out`.

## Rules and limits

| Field or route | Rule |
|---|---|
| Phone number | Indonesian mobile: `08...`, `628...` or `+628...`. Spaces and dashes are removed before saving |
| Email | Lowercased and trimmed. An email is a login name, so it is unique |
| Password | 8 to 72 **bytes** (72 is the limit of bcrypt). A new password must differ from the current one |
| Name, position | Not empty, at most 100 characters |
| Photo address | `http` or `https`, at most 2048 characters. `null` removes the photo. It is an address, not an upload |
| `GET /admin/employees` | `search` matches part of the name or email, at most 100 characters. `pageSize` 1 to 100, default 20 |
| `GET /attendance/summary` | `from` and `to`, at most 366 days. Default: the first of the month of `to`, up to today |
| `GET /admin/attendance` | Same dates. With no dates at all, **only today**. `employeeId` narrows to one employee. One row per employee per day |
| `GET /admin/notifications` | `limit` 1 to 50, default 20. Only the last 30 days count |
| Unknown fields | Dropped by the services, so a caller cannot set `isActive` or `role` on a route that does not allow it |
| An admin | Cannot switch off their own account |

## Internal routes

Used only between services and not reachable through the gateway.

| Method and path | Service | Used by | Purpose |
|---|---|---|---|
| `POST /internal/logins` | auth | employee service | Create the login of a new employee. Same id as the employee. Repeating the same call is safe (`200` instead of `201`) |
| `PATCH /internal/logins/{id}` | auth | employee service | Switch a login on or off |
| `DELETE /internal/logins/{id}` | auth | employee service | Remove a login (to undo a half-done add) |
| `GET /internal/employees?ids=a,b,c` | employee | attendance and log services | Names and positions for up to 100 ids. Unknown ids are skipped |

## Keeping the documentation true

The Swagger text is written by hand in `backend/apps/api-gateway/src/docs` and `src/types`, next to the gateway, not generated from the services. When a service changes a rule or a response, update the matching decorator in the same commit. A test compares the routes in the generated documentation (which lists every route of the controller) with the route table in the tests, so a new route fails the tests until it is added to that table and documented in full (see [testing.md](testing.md)).
