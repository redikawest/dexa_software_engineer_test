# WFH Attendance System: documentation

A work-from-home attendance system. Employees clock in and out and look at their own attendance. HR admins manage employees and read everybody's attendance. When an employee changes their own profile, the admins are told, and the change is written to a separate log database.

## At a glance

| | |
|---|---|
| Employee app | Log in, edit profile (phone, photo address, password), clock in and out, attendance summary for a date range |
| HR admin app | Add and change employees, read all attendance (read only), see profile changes made by employees |
| Backend | NestJS monorepo: four services behind one API gateway, REST over HTTP |
| Messaging | RabbitMQ: a profile change becomes an event that is logged and shown to admins |
| Data | PostgreSQL, two databases (`dexa_main` and `dexa_logs`) |
| Frontend | React Router (framework mode) with Tailwind |

## Where to find what

| You want to know | Read |
|---|---|
| How to run it on my machine | [getting-started.md](getting-started.md) |
| How the pieces fit together, and what happens when one is down | [architecture.md](architecture.md) |
| What the API looks like (conventions, routes) | [api.md](api.md), and the live docs at `http://localhost:3000/docs` |
| Which tables exist and who owns them | [data-model.md](data-model.md) |
| How a profile change reaches the log and the admins | [events.md](events.md) |
| How logging in, roles and secrets work | [security.md](security.md) |
| How the frontend is built | [frontend.md](frontend.md) |
| How to run and write tests | [testing.md](testing.md) |
| Why it was built this way | [decisions.md](decisions.md) |
| What is not done, and what is risky | [known-limitations.md](known-limitations.md) |

Suggested reading order: a new developer reads getting-started, then architecture. A reviewer reads architecture, security, decisions, and known-limitations.

## How these documents are kept

- Each document answers one question and links to the code instead of copying it.
- The generated API documentation (Swagger) is the reference for request and response shapes. [api.md](api.md) only holds what Swagger cannot say: conventions and rules that apply to every route.
- When behavior changes, change the code, its tests, and the document in the same commit.
