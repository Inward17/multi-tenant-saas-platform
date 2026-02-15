# Multi-Tenant SaaS Platform

A production-grade, full-stack **Multi-Tenant SaaS** application featuring organization-scoped data isolation, role-based access control, and a modular architecture built with modern technologies.

## 🚀 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | [NestJS](https://nestjs.com/) v11 | Modular REST API framework |
| **ORM** | [Prisma](https://www.prisma.io/) v7 | Type-safe database access |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Relational data store |
| **Auth** | [Passport](https://www.passportjs.org/) + JWT | Cookie-based authentication |
| **Frontend** | [SvelteKit](https://kit.svelte.dev/) v2 + [Svelte 5](https://svelte.dev/) | Reactive UI framework |
| **Bundler** | [Vite](https://vitejs.dev/) v7 | Fast dev server & builds |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | End-to-end type safety |

## 📂 Project Structure

```
multi-tenant-saas-platform/
├── backend/                        # NestJS API Server
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema & relations
│   │   └── seed.ts                 # Database seeding script
│   └── src/
│       ├── auth/                   # Authentication (login, register, JWT)
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth.module.ts
│       │   ├── jwt.strategy.ts
│       │   └── dto/
│       ├── common/                 # Shared guards & decorators
│       │   ├── guards/             # JwtAuthGuard, RolesGuard
│       │   └── decorators/         # @CurrentUser, @Public, @Roles
│       ├── organizations/          # Organization CRUD
│       ├── users/                  # User management & role updates
│       ├── projects/               # Project CRUD (soft-delete)
│       ├── tasks/                  # Task CRUD (status, assignment)
│       ├── prisma/                 # PrismaService (global DB access)
│       ├── app.module.ts           # Root module
│       └── main.ts                 # Bootstrap & middleware config
│
└── frontend/                       # SvelteKit Application
    └── src/
        ├── lib/
        │   ├── api/                # API client modules
        │   │   ├── client.ts       # Base HTTP client with auth
        │   │   ├── auth.ts         # Login / Register calls
        │   │   ├── projects.ts     # Project API
        │   │   ├── tasks.ts        # Task API
        │   │   ├── users.ts        # User API
        │   │   └── organizations.ts
        │   ├── components/ui/      # Reusable UI components
        │   │   ├── Button.svelte
        │   │   ├── Card.svelte
        │   │   ├── Modal.svelte
        │   │   ├── Badge.svelte
        │   │   ├── Input.svelte
        │   │   ├── Toast.svelte
        │   │   ├── EmptyState.svelte
        │   │   └── SkeletonLoader.svelte
        │   └── stores/             # Svelte stores (auth, toast)
        └── routes/
            ├── login/              # Login page
            ├── register/           # Registration page
            └── dashboard/          # Protected dashboard
                ├── projects/       # Projects list & detail
                └── tasks/          # Tasks management
```

## 🏗️ Architecture

### Backend — Domain-Driven Modular Design

Each domain feature (Auth, Users, Projects, Tasks, Organizations) is encapsulated in its own **NestJS Module** with a dedicated Controller → Service → DTO layer:

```
Feature Module
├── feature.module.ts       # Module declaration
├── feature.controller.ts   # HTTP route handlers
├── feature.service.ts      # Business logic
└── dto/                    # Request validation schemas
```

- **Global Guards**: `JwtAuthGuard` and `RolesGuard` are registered at the app level via `APP_GUARD`, protecting all routes by default.
- **Public Routes**: Opt-in with the `@Public()` decorator.
- **Tenant Isolation**: All queries are scoped to the user's `organizationId`.

### Frontend — Component-Based Architecture

- **API Layer** (`lib/api/`): Centralized HTTP client with cookie-based auth handling.
- **UI Components** (`lib/components/ui/`): Reusable design system primitives.
- **State Management** (`lib/stores/`): Svelte stores for auth state and toast notifications.
- **Route Guards** (`dashboard/+layout.ts`): Client-side auth protection for dashboard routes.

### Database Schema

```
Organization ──┬── User (OWNER | ADMIN | MEMBER)
               ├── Project ── Task (TODO | IN_PROGRESS | DONE)
               └── AuditLog
```

- **Soft Deletes**: Projects and Tasks support `deletedAt` for safe deletion.
- **Cascading Deletes**: Removing an Organization cascades to all related records.
- **Indexed Queries**: Composite indexes on `organizationId` for tenant-scoped performance.

## ✨ Features

- **JWT Authentication** — Secure cookie-based login with `httpOnly` tokens.
- **Multi-Tenancy** — Organization-scoped data isolation at the query level.
- **Role-Based Access Control** — `OWNER`, `ADMIN`, `MEMBER` roles with guard-level enforcement.
- **Project Management** — Full CRUD with soft-delete support.
- **Task Management** — Create, assign, update status (`TODO` → `IN_PROGRESS` → `DONE`).
- **Audit Logging** — Track actions with entity, user, and metadata context.
- **Input Validation** — DTOs with `class-validator` (whitelist + forbidNonWhitelisted).
- **Responsive UI** — Modern dark-themed dashboard with reusable components.

## 🛠️ Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** (or pnpm)
- **PostgreSQL** database running locally or remotely

### 1. Clone the Repository

```bash
git clone https://github.com/Inward17/multi-tenant-saas-platform.git
cd multi-tenant-saas-platform
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/saas_db?schema=public"
JWT_SECRET="your-super-secret-key"
```

Run migrations and seed the database:
```bash
npx prisma migrate dev --name init
npm run seed
```

Start the API server:
```bash
npm run start:dev
```

> API available at **http://localhost:3000**

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

> App available at **http://localhost:5173**

## 📜 Available Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run production build |
| `npm run seed` | Seed the database |
| `npm run lint` | Lint & auto-fix |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | Type-check with `svelte-check` |

