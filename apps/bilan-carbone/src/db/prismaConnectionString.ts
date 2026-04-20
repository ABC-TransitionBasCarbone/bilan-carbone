const TEST_PRISMA_URL = 'postgresql://localhost:5432/postgres'

// POSTGRES_PRISMA_POOL_URL is optional and falls back to POSTGRES_PRISMA_URL.
export const getPrismaConnectionString = (): string | undefined => {
  const isTestRuntime = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined

  return (
    process.env.POSTGRES_PRISMA_POOL_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    (isTestRuntime ? TEST_PRISMA_URL : undefined)
  )
}
