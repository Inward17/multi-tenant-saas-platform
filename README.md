# 🏢 Multi-Tenant Task Management API (Backend)

A production-ready multi-tenant SaaS backend built with NestJS,
PostgreSQL, and Prisma.

This API supports organization-based data isolation, JWT authentication,
and role-based access control (RBAC).

------------------------------------------------------------------------

## 🚀 Tech Stack

-   Framework: NestJS v11
-   Database: PostgreSQL
-   ORM: Prisma 7
-   Authentication: JWT (httpOnly cookie)
-   Language: TypeScript

------------------------------------------------------------------------

## 🧠 Core Architecture

This system follows strict multi-tenant architecture:

-   Each user belongs to one organization
-   All queries are scoped by `organizationId`
-   `organizationId` is extracted from JWT (never from client input)
-   Role-based access control enforced via global guards

### Request Flow

Client → JWT Guard → Roles Guard → Controller → Service → Prisma →
PostgreSQL

------------------------------------------------------------------------

## 🏗 Features

### ✅ Multi-Tenancy

-   Data isolation per organization
-   No cross-organization access possible
-   organizationId enforced in every query

### 🔐 Authentication

-   Register (creates organization + owner)
-   Login
-   JWT stored in httpOnly cookie
-   Global authentication guard
-   Public route decorator support

### 🛡 Role-Based Access Control (RBAC)

Roles: - OWNER - ADMIN - MEMBER

Access rules enforced via custom `@Roles()` decorator and global
`RolesGuard`.

### 📦 Modular Design

Modules: - Auth - Organizations - Users - Projects - Tasks - Common
(guards, decorators)

### 📊 Pagination & Filtering

-   Task pagination
-   Status filtering
-   Meta response included

### 🧾 Validation & Error Handling

-   Global ValidationPipe
-   DTO validation using class-validator
-   No raw database errors exposed
-   Proper HTTP exception mapping

------------------------------------------------------------------------

## 🗄 Database Design

### Entities

**Organization** - id (UUID) - name - createdAt

**User** - id (UUID) - email (unique) - password (hashed) - role (OWNER
\| ADMIN \| MEMBER) - organizationId (FK)

**Project** - id (UUID) - name - organizationId (FK)

**Task** - id (UUID) - title - description - status (TODO \| IN_PROGRESS
\| DONE) - projectId (FK) - assignedTo (FK, nullable) - organizationId
(FK) - createdAt - updatedAt

### Key Decisions

-   UUID primary keys (better for distributed systems)
-   Cascade deletes for organization hierarchy
-   Direct organizationId on Task for efficient filtering
-   onDelete: SetNull for task assignee

------------------------------------------------------------------------

## 🔐 Security Design

-   JWT stored in httpOnly cookie
-   organizationId derived from signed token
-   Guards registered globally
-   Strict whitelist DTO validation
-   Role-based endpoint restrictions
-   No sensitive fields returned (e.g., passwords)

------------------------------------------------------------------------

## 📡 API Endpoints

### Auth

  Method   Endpoint         Description
  -------- ---------------- -----------------------------
  POST     /auth/register   Create organization + owner
  POST     /auth/login      Login and receive JWT

------------------------------------------------------------------------

### Organizations

  Method   Endpoint         Roles
  -------- ---------------- -------------------
  GET      /organizations   Any authenticated
  PATCH    /organizations   OWNER
  DELETE   /organizations   OWNER

------------------------------------------------------------------------

### Users

  Method   Endpoint          Roles
  -------- ----------------- --------------
  GET      /users            OWNER, ADMIN
  PATCH    /users/:id/role   OWNER

------------------------------------------------------------------------

### Projects

  Method   Endpoint        Roles
  -------- --------------- -------------------
  POST     /projects       OWNER, ADMIN
  GET      /projects       Any authenticated
  GET      /projects/:id   Any authenticated
  PATCH    /projects/:id   OWNER, ADMIN
  DELETE   /projects/:id   OWNER

------------------------------------------------------------------------

### Tasks

  Method   Endpoint     Roles
  -------- ------------ --------------------------------
  POST     /tasks       OWNER, ADMIN
  GET      /tasks       Any authenticated
  GET      /tasks/:id   Any authenticated
  PATCH    /tasks/:id   ADMIN (any), MEMBER (own only)
  DELETE   /tasks/:id   OWNER, ADMIN

------------------------------------------------------------------------

## ⚙️ Environment Variables

Create a `.env` file in the root:

    DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
    JWT_SECRET="your_jwt_secret"

------------------------------------------------------------------------

## 🛠 Setup & Installation

``` bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run start:dev
```

Server runs on:

http://localhost:3000

------------------------------------------------------------------------

## 🧪 Production Build

``` bash
npm run build
npm run start:prod
```

------------------------------------------------------------------------

## 🎯 What This Project Demonstrates

-   Modular NestJS architecture
-   Multi-tenant SaaS design
-   Secure JWT authentication
-   Role-based access control
-   Proper separation of concerns
-   Clean database relationships
-   Production-ready validation & error handling

------------------------------------------------------------------------
