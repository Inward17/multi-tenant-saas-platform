# Multi-Tenant SaaS Platform

A modern, full-stack Multi-Tenant SaaS application built with **NestJS** (Backend) and **SvelteKit** (Frontend). This project includes authentication, organization management, project tracking, and task management features.

## 🚀 Technologies

### Backend
- **[NestJS](https://nestjs.com/)**: A progressive Node.js framework for building efficient, scalable server-side applications.
- **[Prisma](https://www.prisma.io/)**: Next-generation Node.js and TypeScript ORM.
- **[PostgreSQL](https://www.postgresql.org/)**: Advanced open source relational database.
- **[Passport](https://www.passportjs.org/)**: Authentication middleware for Node.js (JWT strategy).

### Frontend
- **[SvelteKit](https://kit.svelte.dev/)**: Web development framework for building Svelte apps.
- **[Vite](https://vitejs.dev/)**: Next Generation Frontend Tooling.
- **[TypeScript](https://www.typescriptlang.org/)**: Typed JavaScript at Any Scale.

## 📂 Project Structure

```
.
├── backend/            # NestJS Backend API
│   ├── src/            # Source code
│   ├── prisma/         # Database schema and seeds
│   └── test/           # E2E tests
└── frontend/           # SvelteKit Frontend
    ├── src/            # Components, routes, and stores
    └── static/         # Static assets
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- PostgreSQL database

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Set up environment variables:
Create a `.env` file in the `backend` directory and add your database connection string and JWT secret:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/saas_db?schema=public"
JWT_SECRET="your-super-secret-key"
```

Run database migrations and seed data:
```bash
npx prisma migrate dev --name init
npm run seed
```

Start the backend server:
```bash
npm run start:dev
```
The API will be available at `http://localhost:3000`.

### 2. Frontend Setup

Navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

## ✨ Features

- **Authentication**: Secure user login and registration using JWT.
- **Multi-Tenancy**: Support for multiple organizations with isolated data.
- **Role-Based Access Control (RBAC)**: Manage user permissions within organizations.
- **Project Management**: Create, update, and track projects.
- **Task Management**: Assign and manage tasks within projects.
- **Responsive UI**: Modern and responsive interface built with SvelteKit.
