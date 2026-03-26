import 'dotenv/config'
import path from 'path'
import { defineConfig, env } from 'prisma/config'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  schema: path.join(__dirname, 'prisma/schema'),
  migrations: {
    path: path.join(__dirname, 'prisma/schema/migrations'),
    seed: 'tsx prisma/seed/index.ts',
  },
  datasource: {
    url: env('POSTGRES_PRISMA_URL'),
  },
})
