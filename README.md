# HR Portal

End-to-end HR management portal built with **React** (Carbon / IBM design), **Node.js** (Fastify), and **Prisma**. It auto-generates offer letters, onboarding packs, payslips, and exit documents as PDFs, with download and email delivery.

Design system: [IBM on getdesign.md](https://getdesign.md/ibm) — run `npx getdesign@latest add ibm` to refresh `DESIGN.md`.

## Features

- Employee directory with onboarding / active / offboarding / terminated statuses
- Auto PDF generation: offer letter, onboarding pack, payslips, experience & relieving letters
- Document download and email (SMTP / Mailhog in dev)
- Payroll batch payslip generation
- Editable HTML templates (Handlebars)
- Company & SMTP settings
- Audit logging

## Tech stack

| Layer | Stack |
|-------|-------|
| Web | React 19, Vite, `@carbon/react`, React Router |
| API | Fastify 5, Prisma 6, JWT auth, Puppeteer (PDF), Nodemailer |
| Shared | Zod schemas & constants (`packages/shared`) |
| Database | SQLite by default (`apps/api/dev.db`); PostgreSQL optional |

## Prerequisites

- **Node.js 20+** (tested on 22)
- **npm 10+**
- Optional: **Docker** for Mailhog (email capture) and/or PostgreSQL — see `docker-compose.yml`

The API uses **SQLite** out of the box, so you can run the whole project with no Docker. To use PostgreSQL instead, see [Using PostgreSQL](#using-postgresql).

## Quick start

From the repository root:

```bash
# 1. Install all workspace dependencies
npm install

# 2. Create the API env file
cp apps/api/.env.example apps/api/.env

# 3. Build the shared package (web & api depend on it)
npm run build -w @hr-portal/shared

# 4. Generate the Prisma client, create the DB, and seed demo data
npm run db:generate
npm run db:push
npm run db:seed

# 5. (Optional) Start Mailhog to capture outgoing email
docker compose up -d mailhog

# 6. Run the API and web app together
npm run dev
```

Then open:

| Service | URL |
|---------|-----|
| **Web app** | http://localhost:5173 |
| **API** | http://localhost:4500 |
| **Mailhog UI** (if started) | http://localhost:8025 |

The web app calls the API through Vite's dev proxy (`/api` → `localhost:4500`), so you only need to open the web URL in your browser.

### Demo login

| Field | Value |
|-------|-------|
| Email | `admin@hrportal.local` |
| Password | `hradmin123` |

## Environment

Configuration lives in `apps/api/.env` (copy from `apps/api/.env.example`). Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | DB connection string | `file:./dev.db` (SQLite) |
| `PORT` | API port | `4500` |
| `JWT_SECRET` | Auth signing secret | _change in production_ |
| `STORAGE_PATH` | Generated-PDF storage directory | `./storage` |
| `SMTP_HOST` / `SMTP_PORT` | Email server (Mailhog in dev) | `localhost` / `1025` |
| `FROM_EMAIL` / `FROM_NAME` | Default sender | — |
| `COMPANY_*` / `SIGNATORY_*` | Letterhead defaults for PDFs | — |

> The web app has no env file — its API target is configured in `apps/web/vite.config.ts`.

## Using PostgreSQL

1. Start Postgres: `docker compose up -d postgres`
2. In `apps/api/prisma/schema.prisma`, set the datasource `provider` to `postgresql`.
3. In `apps/api/.env`, set:
   `DATABASE_URL="postgresql://hrportal:hrportal@localhost:5432/hrportal"`
4. Re-run `npm run db:generate && npm run db:push && npm run db:seed`.

## Project structure

```
hr-portal/
├── DESIGN.md             # IBM / Carbon design rules
├── docker-compose.yml    # Postgres + Mailhog
├── apps/
│   ├── web/              # React + Vite + @carbon/react
│   └── api/              # Fastify + Prisma + Puppeteer
└── packages/
    └── shared/           # Zod schemas & constants
```

## Scripts (run from repo root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Run API + web concurrently |
| `npm run dev:api` | Run only the API (watch mode) |
| `npm run dev:web` | Run only the web app |
| `npm run build` | Production build of shared → api → web |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:push` | Apply the Prisma schema to the DB |
| `npm run db:seed` | Seed admin user, company & email settings |

## Production build

```bash
npm run build                      # builds shared, api, and web
npm run start -w @hr-portal/api    # serves the API from apps/api/dist
```

The web build outputs static assets to `apps/web/dist/` (serve with any static host).

## API overview

Base URL: `http://localhost:4500`

- `POST /auth/login`, `GET /auth/me`
- `GET /dashboard`
- `GET|POST|PATCH|DELETE /employees`, `POST /employees/:id/onboard|offboard`
- `GET /documents`, `GET /documents/:id/download`, `POST /documents/:id/send`
- `POST /payroll/payslips`
- `GET|PATCH /templates/:type`
- `GET|PATCH /settings/company|email`, `POST /settings/email/test`
- `GET /health`

All routes except `/auth/login` and `/health` require an `Authorization: Bearer <token>` header.
