# Multi-Tenant SaaS Platform

A production-grade, full-stack **Multi-Tenant SaaS** application featuring organization-scoped data isolation, role-based access control, audit logging, and Docker-based deployment — built with modern technologies.

## 🚀 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | [NestJS](https://nestjs.com/) v11 | Modular REST API framework |
| **ORM** | [Prisma](https://www.prisma.io/) v7 | Type-safe database access |
| **Database** | [PostgreSQL](https://www.postgresql.org/) 16 | Relational data store |
| **Auth** | [Passport](https://www.passportjs.org/) + JWT | Cookie-based authentication |
| **Config** | [@nestjs/config](https://docs.nestjs.com/techniques/configuration) + [Joi](https://joi.dev/) | Environment validation |
| **Rate Limiting** | [@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting) | API throttling & protection |
| **Frontend** | [SvelteKit](https://kit.svelte.dev/) v2 + [Svelte 5](https://svelte.dev/) | Reactive UI framework |
| **Bundler** | [Vite](https://vitejs.dev/) v7 | Fast dev server & builds |
| **Testing** | [Jest](https://jestjs.io/) + [Supertest](https://github.com/ladjs/supertest) | Unit & E2E testing |
| **Containerization** | [Docker](https://www.docker.com/) + Docker Compose | Multi-service deployment |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | End-to-end type safety |

## 📂 Project Structure

```
multi-tenant-saas-platform/
├── docker-compose.yml              # 3-service stack (PostgreSQL, API, Frontend)
│
├── backend/                        # NestJS API Server
│   ├── Dockerfile                  # Multi-stage build (Node 20 Alpine)
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema & relations
│   │   └── seed.ts                 # Database seeding script
│   └── src/
│       ├── auth/                   # Authentication (login, register, JWT)
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth.service.spec.ts
│       │   ├── auth.module.ts
│       │   ├── jwt.strategy.ts
│       │   └── dto/
│       ├── common/                 # Shared infrastructure
│       │   ├── guards/             # JwtAuthGuard, RolesGuard
│       │   ├── decorators/         # @CurrentUser, @Public, @Roles
│       │   ├── interceptors/       # LoggingInterceptor (structured JSON logs)
│       │   └── env.validation.ts   # Joi env schema validation
│       ├── audit/                  # Audit log module (paginated)
│       ├── metrics/                # Organization metrics/dashboard API
│       ├── organizations/          # Organization CRUD
│       ├── users/                  # User & team management
│       │   └── dto/                # update-role, update-profile,
│       │                           # change-password, add-member
│       ├── projects/               # Project CRUD (soft-delete)
│       ├── tasks/                  # Task CRUD (repository pattern)
│       │   ├── tasks.repository.ts
│       │   ├── tasks.service.spec.ts
│       │   └── ...
│       ├── prisma/                 # PrismaService (global DB access)
│       ├── app.module.ts           # Root module
│       └── main.ts                 # Bootstrap & middleware config
│
└── frontend/                       # SvelteKit Application
    ├── Dockerfile                  # Multi-stage build (Node 20 Alpine)
    └── src/
        ├── lib/
        │   ├── api/                # API client modules
        │   │   ├── client.ts       # Base HTTP client with auth
        │   │   ├── auth.ts         # Login / Register
        │   │   ├── profile.ts      # Profile & password management
        │   │   ├── team.ts         # Team / member management
        │   │   ├── projects.ts     # Project API
        │   │   ├── tasks.ts        # Task API
        │   │   ├── users.ts        # User API
        │   │   └── organizations.ts
        │   ├── components/ui/      # Reusable UI components
        │   │   ├── Button, Card, Modal, Badge, Input
        │   │   ├── Toast, EmptyState, SkeletonLoader
        │   │   └── ...
        │   └── stores/             # Svelte stores
        │       ├── auth.ts         # Authentication state
        │       ├── toast.ts        # Toast notifications
        │       └── theme.ts        # Light/dark theme
        └── routes/
            ├── login/              # Login page
            ├── register/           # Registration page
            └── dashboard/          # Protected dashboard
                ├── profile/        # User profile & settings
                ├── projects/       # Projects list & detail
                ├── tasks/          # Tasks management
                └── team/           # Team member management
```

## 🏗️ Architecture

### Backend — Domain-Driven Modular Design

Each domain feature is encapsulated in its own **NestJS Module** with a dedicated Controller → Service → DTO layer:

```
Feature Module
├── feature.module.ts       # Module declaration
├── feature.controller.ts   # HTTP route handlers
├── feature.service.ts      # Business logic
├── feature.service.spec.ts # Unit tests
├── feature.repository.ts   # Data access (where applicable)
└── dto/                    # Request validation schemas
```

**Cross-Cutting Concerns** (registered globally in `AppModule`):
- `JwtAuthGuard` — Protects all routes by default; opt-out with `@Public()`
- `RolesGuard` — Enforces `@Roles()` decorator permissions
- `LoggingInterceptor` — Structured JSON request logging with request IDs, user context, and response times
- `ConfigModule` + `envValidationSchema` — Validates environment variables at startup with Joi
- `ThrottlerModule` — Rate limiting (30 requests per 60 seconds)

### Frontend — Component-Based Architecture

- **API Layer** (`lib/api/`): Centralized HTTP client with cookie-based auth handling
- **UI Components** (`lib/components/ui/`): Reusable design system primitives
- **State Management** (`lib/stores/`): Svelte stores for auth, toast notifications, and theme
- **Route Guards** (`dashboard/+layout.ts`): Client-side auth protection for dashboard routes

### Database Schema

```
Organization ──┬── User (OWNER | ADMIN | MEMBER)
               ├── Project ── Task (TODO | IN_PROGRESS | DONE)
               └── AuditLog
```

- **Soft Deletes**: Projects and Tasks support `deletedAt` for safe deletion
- **Cascading Deletes**: Removing an Organization cascades to all related records
- **Indexed Queries**: Composite indexes on `organizationId` for tenant-scoped performance

## ✨ Features

### Core
- **JWT Authentication** — Secure cookie-based login with `httpOnly` tokens
- **Multi-Tenancy** — Organization-scoped data isolation at the query level
- **Role-Based Access Control** — `OWNER`, `ADMIN`, `MEMBER` roles with guard-level enforcement

### Business Logic
- **Project Management** — Full CRUD with soft-delete support
- **Task Management** — Create, assign, update status (`TODO` → `IN_PROGRESS` → `DONE`) with repository pattern
- **Team Management** — Add members to organizations, manage roles
- **User Profiles** — Update profile details and change password
- **Organization Metrics** — Dashboard API with user, project, and task statistics (grouped by status)
- **Audit Logging** — Paginated audit trail tracking actions, entities, users, and metadata

### Infrastructure
- **Docker Deployment** — Multi-stage Dockerfiles + Docker Compose for full-stack deployment
- **Environment Validation** — Startup-time env validation using Joi schemas
- **Rate Limiting** — API throttling via `@nestjs/throttler` (30 req/min)
- **Structured Logging** — JSON request logs with request IDs, user context, durations, and error tracking
- **Unit Testing** — Jest-based tests for services and guards
- **Input Validation** — DTOs with `class-validator` (whitelist + forbidNonWhitelisted)

### Frontend
- **Responsive UI** — Modern dark-themed dashboard with reusable component library
- **Theme Management** — Client-side theme store for light/dark mode
- **Team Page** — Manage organization members from the dashboard
- **Toast Notifications** — Global notification system
- **Skeleton Loaders** — Loading states for improved perceived performance
- **Empty States** — Friendly empty state components

## 🛠️ Getting Started

### Prerequisites

- **Node.js** v18+ (for local development)
- **Docker** & **Docker Compose** (for containerized deployment)
- **PostgreSQL** (only needed if running without Docker)

### Option A: Docker (Recommended)

Spin up the entire stack with a single command:

```bash
docker compose up --build
```

This starts:
| Service | URL | Description |
|---------|-----|-------------|
| **PostgreSQL** | `localhost:5432` | Database (auto-created) |
| **API** | `http://localhost:3000` | NestJS backend (auto-migrates) |
| **Frontend** | `http://localhost:5173` | SvelteKit app |

To stop:
```bash
docker compose down
```

To reset the database (delete volume):
```bash
docker compose down -v
```

### Option B: Local Development

#### 1. Clone the Repository

```bash
git clone https://github.com/Inward17/multi-tenant-saas-platform.git
cd multi-tenant-saas-platform
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/saas_db?schema=public"
JWT_SECRET="your-super-secret-key-min-16-chars"
PORT=3000
NODE_ENV=development
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

#### 3. Frontend Setup

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
| `npm run test:cov` | Run tests with coverage |
| `npm run test:e2e` | Run E2E tests |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | Type-check with `svelte-check` |

### Docker

| Command | Description |
|---------|-------------|
| `docker compose up --build` | Build & start all services |
| `docker compose down` | Stop all services |
| `docker compose down -v` | Stop & delete database volume |
| `docker compose logs -f api` | Tail API logs |
