import 'dotenv/config'
import path from 'path'
import { defineConfig } from 'prisma/config'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  schema: path.join(__dirname, 'prisma/schema'),
  migrations: {
    path: path.join(__dirname, 'prisma/schema/migrations'),
    seed: 'tsx prisma/seed/index.ts',
  },
  datasource: {
    // Fallback to empty string so `prisma generate` works without a DB
    // connection (e.g. during `yarn install` before .env is configured).
    // Database operations (migrate, seed, app runtime) still require the
    // POSTGRES_PRISMA_URL env var to be set in the .env file.
    url: process.env.POSTGRES_PRISMA_URL ?? '',
  },
})
