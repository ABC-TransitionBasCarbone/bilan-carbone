import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  migrations: {
    seed: 'tsx ../../packages/db-common/prisma/seed/index.ts',
  },
  datasource: {
    url: env('POSTGRES_PRISMA_URL'),
  },
})
