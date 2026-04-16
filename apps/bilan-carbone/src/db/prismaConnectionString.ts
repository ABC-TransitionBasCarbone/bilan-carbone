export const getPrismaConnectionString = () => {
  const connectionString = process.env.POSTGRES_PRISMA_POOL_URL ?? process.env.POSTGRES_PRISMA_URL

  if (!connectionString) {
    throw new Error('Missing database connection string: set POSTGRES_PRISMA_URL or POSTGRES_PRISMA_POOL_URL')
  }

  return connectionString
}
