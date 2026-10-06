import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  migrations: {
    seed: 'tsx ../../packages/common/db/prisma/seed/index.ts --target bc',
  },
  datasource: {
    url: env('POSTGRES_PRISMA_URL'),
  },
})
