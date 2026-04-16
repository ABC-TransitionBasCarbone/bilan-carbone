const TEST_PRISMA_CONNECTION_STRING = 'postgresql://postgres:postgres@localhost:5432/postgres'

// POSTGRES_PRISMA_POOL_URL is optional and falls back to POSTGRES_PRISMA_URL.
export const getPrismaConnectionString = (): string | undefined => {
  return (
    process.env.POSTGRES_PRISMA_POOL_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    (process.env.NODE_ENV === 'test' ? TEST_PRISMA_CONNECTION_STRING : undefined)
  )
}
