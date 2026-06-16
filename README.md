# HR Portal

End-to-end HR management portal built with **React** (Carbon / IBM design), **Node.js** (Fastify), and **PostgreSQL**. Auto-generates offer letters, onboarding packs, payslips, and exit documents as PDFs, with download and email delivery.

Design system: [IBM on getdesign.md](https://getdesign.md/ibm) — run `npx getdesign@latest add ibm` to refresh `DESIGN.md`.

## Features

- Employee directory with onboarding / active / offboarding / terminated statuses
- Auto PDF generation: offer letter, onboarding pack, payslips, experience & relieving letters
- Document download and email (SMTP / Mailhog in dev)
- Payroll batch payslip generation
- Editable HTML templates (Handlebars)
- Company & SMTP settings
- Audit logging

## Prerequisites

- Node.js 20+
- Optional: Docker for PostgreSQL + Mailhog (see `docker-compose.yml`)

By default the API uses **SQLite** (`apps/api/dev.db`) so you can run without Docker. For PostgreSQL, set `DATABASE_URL` in `apps/api/.env` and change `provider` in `prisma/schema.prisma` to `postgresql`.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Start Mailhog for email capture
docker compose up -d mailhog

# 3. Build shared package, push schema, seed
npm run build -w @hr-portal/shared
cd apps/api && npx prisma generate && npx prisma db push && npm run db:seed

# 4. Run API + web
cd ../..
npm run dev
```

- **Web:** http://localhost:5173  
- **API:** http://localhost:3001  
- **Mailhog UI:** http://localhost:8025  

### Demo login

| Field | Value |
|-------|--------|
| Email | `admin@hrportal.local` |
| Password | `hradmin123` |

## Environment

Copy [`apps/api/.env.example`](apps/api/.env.example) to `apps/api/.env`. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Auth signing secret |
| `STORAGE_PATH` | PDF file storage directory |
| `SMTP_*` | Email (defaults to Mailhog on port 1025) |
| `COMPANY_*` | Letterhead defaults for PDFs |

## Project structure

```
hr-portal/
├── DESIGN.md           # IBM / Carbon design rules for agents
├── apps/
│   ├── web/            # React + Vite + @carbon/react
│   └── api/            # Fastify + Prisma + Puppeteer
├── packages/shared/    # Zod schemas & constants
└── docker-compose.yml  # Postgres + Mailhog
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | API + web concurrently |
| `npm run db:push` | Apply Prisma schema |
| `npm run db:seed` | Seed admin user & sample employees |
| `npm run build` | Production build |

## API overview

- `POST /auth/login`, `GET /auth/me`
- `GET /dashboard`
- `GET|POST|PATCH|DELETE /employees`, `POST /employees/:id/onboard|offboard`
- `GET /documents`, `GET /documents/:id/download`, `POST /documents/:id/send`
- `POST /payroll/payslips`
- `GET|PATCH /templates/:type`
- `GET|PATCH /settings/company|email`, `POST /settings/email/test`

All routes except `/auth/login` and `/health` require `Authorization: Bearer <token>`.
