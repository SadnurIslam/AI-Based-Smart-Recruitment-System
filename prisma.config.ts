import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseProvider = process.env.DATABASE_PROVIDER?.trim().toLowerCase();

export default defineConfig({
  schema:
    databaseProvider === "postgresql"
      ? "prisma/schema.postgres.prisma"
      : "prisma/schema.prisma",
  migrations: {
    path:
      databaseProvider === "postgresql"
        ? "prisma/migrations-postgres"
        : "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
