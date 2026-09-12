import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const directory = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(directory, ".env"), quiet: true });
config({ path: resolve(directory, "../../.env"), quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Generation works without a database; migration commands require DATABASE_URL.
  datasource: { url: process.env.DATABASE_URL },
});
