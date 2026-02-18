# Multi-Tenant SaaS Platform

A production-grade, full-stack **Multi-Tenant SaaS** application featuring organization-scoped data isolation, role-based access control, real-time updates, background job processing, and Docker-based deployment.

## 🚀 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | [NestJS](https://nestjs.com/) v11 | Modular REST API framework |
| **Real-time** | [Socket.io](https://socket.io/) | WebSockets for live updates |
| **Queues** | [BullMQ](https://docs.bullmq.io/) + Redis | Background job processing |
| **ORM** | [Prisma](https://www.prisma.io/) v7 | Type-safe database access |
| **Database** | [PostgreSQL](https://www.postgresql.org/) 16 | Relational data store |
| **Cache/PubSub** | [Redis](https://redis.io/) 7 | Caching, Queues, & Pub/Sub |
| **Auth** | [Passport](https://www.passportjs.org/) + JWT | Cookie-based authentication |
| **Frontend** | [SvelteKit](https://kit.svelte.dev/) v2 + [Svelte 5](https://svelte.dev/) | Reactive UI framework |
| **Bundler** | [Vite](https://vitejs.dev/) v7 | Fast dev server & builds |
| **Containerization** | [Docker](https://www.docker.com/) + Compose | Multi-service deployment |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | End-to-end type safety |

## 📂 Project Structure

```
multi-tenant-saas-platform/
├── docker-compose.yml              # 4-service stack (Postgres, Redis, API, Frontend)
│
├── backend/                        # NestJS API Server
│   ├── Dockerfile                  # Multi-stage build (Node 20 Alpine)
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── seed.ts                 # Seeding script
│   └── src/
│       ├── auth/                   # Authentication (JWT, Cookies)
│       ├── common/                 # Guards, Decorators, Interceptors
│       ├── events/                 # WebSocket Gateway (Socket.io)
│       │   ├── events.gateway.ts   # Real-time event broadcasting
│       │   └── events.module.ts
│       ├── jobs/                   # Background Workers (BullMQ)
│       │   ├── notifications.processor.ts # Async notification handling
│       │   └── jobs.module.ts
│       ├── audit/                  # Audit Logging
│       ├── metrics/                # Dashboard Metrics
│       ├── organizations/          # Organization CRUD
│       ├── users/                  # User Management
│       ├── projects/               # Project Management
│       ├── tasks/                  # Task Management
│       ├── app.module.ts           # Root Module
│       └── main.ts                 # Bootstrap
│
└── frontend/                       # SvelteKit Application
    ├── Dockerfile
    └── src/
        ├── lib/
        │   ├── api/                # API Client Modules
        │   ├── realtime/           # WebSocket Client
        │   │   └── socket.ts       # Socket.io connection & subscriptions
        │   ├── components/ui/      # Reusable UI Library
        │   └── stores/             # Svelte Stores (Auth, Theme, Toast)
        └── routes/
            ├── dashboard/
            │   ├── activity/       # Real-time Activity Feed
            │   ├── projects/       # Projects Board
            │   ├── tasks/          # Task Management
            │   ├── team/           # Team Management
            │   └── profile/        # User Settings
            └── (auth)/             # Login / Register
```

## ✨ Features

### Core
- **JWT Authentication** — Secure cookie-based login (`httpOnly`)
- **Multi-Tenancy** — Data isolation via `organizationId`
- **Role-Based Access Control** — `OWNER`, `ADMIN`, `MEMBER` roles

### Real-Time & Async
- **Live Updates** — Real-time task changes (created/updated/deleted) broadcasted via WebSockets
- **Activity Feed** — Live stream of organization activities
- **Background Jobs** — Async task processing via Redis queues (e.g., notifications)

### Business Logic
- **Project & Task Management** — Full CRUD with repository pattern
- **Team Management** — Add/remove members, role management
- **Audit Logging** — Comprehensive trail of user actions
- **Metrics Dashboard** — Aggregated stats for organizations

### Infrastructure
- **Docker Compose** — Full stack: Postgres, Redis, API, Frontend
- **Structured Logging** — JSON logs with request tracking
- **Rate Limiting** — API throttling protection
- **Env Validation** — Joi-based configuration checks

## 🛠️ Getting Started

### Prerequisites

- **Docker** & **Docker Compose**
- *Or for local dev:* Node.js v18+, PostgreSQL, Redis

### Option A: Docker (Recommended)

Start the entire stack (Database, Cache, API, Frontend):

```bash
docker compose up --build
```

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | `http://localhost:5173` | SvelteKit App |
| **API** | `http://localhost:3000` | NestJS Backend |
| **Postgres** | `localhost:5432` | Database |
| **Redis** | `localhost:6379` | Cache & Queues |

To stop:
```bash
docker compose down -v
```

### Option B: Local Development

#### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/saas_db?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="super-secret-key-min-16-chars"
PORT=3000
```

Start Infrastructure (if needed):
```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:16-alpine
docker run -d -p 6379:6379 redis:7-alpine
```

Run Migrations & Start:
```bash
npx prisma migrate dev --name init
npm run start:dev
```

#### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 📜 Available Scripts

### Backend

- `npm run start:dev` — Watch mode
- `npm run build` — Compile to `dist/`
- `npm run test` — Unit tests
- `npm run test:e2e` — End-to-end tests

### Frontend

- `npm run dev` — Dev server
- `npm run build` — Production build
- `npm run check` — Type check

