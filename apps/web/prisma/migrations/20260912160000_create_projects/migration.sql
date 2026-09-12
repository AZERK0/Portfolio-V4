-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "summary" VARCHAR(320) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "role" VARCHAR(120) NOT NULL,
    "year" INTEGER NOT NULL,
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageUrl" VARCHAR(2048),
    "imageAlt" VARCHAR(240),
    "accentColor" VARCHAR(7) NOT NULL DEFAULT '#f15a24',
    "liveUrl" VARCHAR(2048),
    "sourceUrl" VARCHAR(2048),
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_status_sortOrder_createdAt_id_idx" ON "Project"("status", "sortOrder", "createdAt", "id");

-- Editorial integrity: these checks complement the Prisma model.
ALTER TABLE "Project"
    ALTER COLUMN "technologies" SET NOT NULL,
    ADD CONSTRAINT "Project_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    ADD CONSTRAINT "Project_required_content" CHECK (
        length(trim("title")) > 0 AND
        length(trim("summary")) > 0 AND
        length(trim("description")) > 0 AND
        length(trim("category")) > 0 AND
        length(trim("role")) > 0
    ),
    ADD CONSTRAINT "Project_year_range" CHECK ("year" BETWEEN 1900 AND 2100),
    ADD CONSTRAINT "Project_accent_color" CHECK ("accentColor" ~ '^#[0-9a-fA-F]{6}$'),
    ADD CONSTRAINT "Project_publication_date" CHECK ("status" <> 'PUBLISHED' OR "publishedAt" IS NOT NULL),
    ADD CONSTRAINT "Project_image_url" CHECK ("imageUrl" IS NULL OR "imageUrl" ~ '^(https?://[^[:space:]]+|/[a-zA-Z0-9/_%.-]+)$'),
    ADD CONSTRAINT "Project_live_url" CHECK ("liveUrl" IS NULL OR "liveUrl" ~ '^https?://[^[:space:]]+$'),
    ADD CONSTRAINT "Project_source_url" CHECK ("sourceUrl" IS NULL OR "sourceUrl" ~ '^https?://[^[:space:]]+$');
