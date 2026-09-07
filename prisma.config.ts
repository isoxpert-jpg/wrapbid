// Prisma 7 no longer loads .env automatically — do it before defineConfig runs.
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

/**
 * Prisma 7 moved the datasource connection URL out of schema.prisma and into
 * this file. The schema still declares `provider = "sqlite"`; the URL and the
 * seed command live here.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
