import 'dotenv/config'
import path from 'path'
import { defineConfig, env } from 'prisma/config'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const databaseUrl =
  process.env.POSTGRES_PRISMA_URL ??
  (process.argv.includes('generate')
    ? 'postgresql://prisma:prisma@localhost:5432/prisma'
    : env('POSTGRES_PRISMA_URL'))

export default defineConfig({
  schema: path.join(__dirname, 'prisma/schema'),
  migrations: {
    path: path.join(__dirname, 'prisma/schema/migrations'),
    seed: 'tsx prisma/seed/index.ts',
  },
  datasource: {
    url: databaseUrl,
  },
})
