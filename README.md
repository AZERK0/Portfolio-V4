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

Copy `.env.example` to `apps/web/.env` and set `DATABASE_URL` to your PostgreSQL connection string. The application reads this file through Next.js; Prisma also accepts a root `.env` for CLI usage. No connection string is hardcoded. Start the development server with:

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

## Project gallery

The section immediately after the hero reads published projects from PostgreSQL on the server. `GET /api/projects` exposes the same public catalog with a `source` field (`database` or `demo`), without caching database failures. There are no public write endpoints or administrator panel yet.

- The gallery uses semantic HTML cards and CSS perspective/transforms, without Three.js, WebGL, or a continuous JavaScript rendering loop. Image, metadata and progressive backdrop blur move together. Pointer-driven tilt and a subtle light reflection enhance hover. Horizontal dragging, horizontal trackpad gestures, previous/next buttons, direct selection, and keyboard arrows/Home/End navigate the complete catalog. Vertical page scrolling stays native.
- Each project opens an accessible native dialog. Escape closes it and focus returns to its trigger. Site/source links appear only when configured.
- A continuous light-to-charcoal gradient joins the hero and the dark project section. CSS scroll timelines progressively fade the hero and reveal the gallery where supported; other browsers retain the complete static composition. Reduced-motion preferences disable scroll animations, tilt and sliding. Inactive cards are inert and hidden from assistive technology; failed images use local fallback artwork.
- Missing or unreachable database: four **clearly labeled fictional examples**, using locally stored SVG artwork, are displayed. They are never inserted into PostgreSQL. A failed database read is reported server-side without logging credentials.
- Connected but empty database (or only drafts): an intentional empty state is shown, **not** fabricated projects.

### Database setup and migrations

Use an existing PostgreSQL database or provision one with your hosting provider, then configure `apps/web/.env`. With `DATABASE_URL` set:

```bash
pnpm --filter web db:validate
pnpm --filter web db:migrate
pnpm --filter web db:generate
```

`db:migrate` applies the versioned initial migration in `apps/web/prisma/migrations`. It creates the `Project` table, publication enum, unique slug, sorting index, and data-integrity constraints. It does not reset data or insert examples. Client generation also runs automatically before `dev` and `build` and does not require a database connection.

For future schema changes, use `pnpm --filter web db:migrate:dev --name your_change` against a development database (Prisma may require shadow-database privileges). Use `db:migrate` in deployment setup; do not use `db push` in production.

Until the future authenticated administrator panel exists, maintain records locally with `pnpm --filter web db:studio`. Never expose Studio as a public administration service.

### Project content contract

Required content: unique `slug`, `title`, `summary`, plain-text `description`, `category`, `role`, and `year`. `technologies` is a string array. Optional `imageUrl` and `imageAlt` describe the preview; a landscape image with an **8:5 ratio** works best. Use local `/projects/...` assets or HTTP(S) images. Images are rendered directly in HTML and no longer require WebGL/CORS texture access; a local cover is retained if loading fails. `liveUrl` and `sourceUrl` accept HTTP(S) URLs only. `accentColor` is a six-digit hex color.

Projects default to `DRAFT`. To publish, set `status = PUBLISHED` **and** `publishedAt` to a current or past timestamp. Future timestamps remain hidden until that time; `ARCHIVED` and draft records never enter the public catalog. Ordering is `sortOrder` ascending, then newest `createdAt`, then `id` for stable ties. All published projects are returned. The public DTO excludes editorial status and internal timestamps.

The future admin panel should validate field lengths, URLs, color, year, and publication state before writing, and enforce authentication/authorization on every mutation. Database constraints provide the final integrity boundary.
