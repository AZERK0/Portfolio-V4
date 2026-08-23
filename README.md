# Portfolio-V4

A minimal Next.js starter configured for the Portfolio-V4 workspace.

## Stack

- Next.js with the App Router and TypeScript
- Tailwind CSS
- shadcn/ui configuration
- Next.js route-handler API support
- Prisma with PostgreSQL
- pnpm workspaces
- ESLint and Prettier

## Getting started

Install dependencies from the workspace root:

```bash
pnpm install
```

Copy `.env.example` to `.env` and set `DATABASE_URL` for your PostgreSQL instance. Start the development server with:

```bash
pnpm dev
```

The web application lives in `apps/web` and can also be run from that directory with `pnpm dev`.

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm format:check
```

The Prisma schema is located at `apps/web/prisma/schema.prisma`. Database models and API routes can be added when application requirements are defined.
