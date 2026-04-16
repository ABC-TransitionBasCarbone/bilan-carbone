export const getPrismaConnectionString = () => {
  return process.env.POSTGRES_PRISMA_POOL_URL ?? process.env.POSTGRES_PRISMA_URL
}
