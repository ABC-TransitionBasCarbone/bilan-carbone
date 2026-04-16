import { getPrismaConnectionString } from './prismaConnectionString'

describe('getPrismaConnectionString', () => {
  const initialEnv = process.env

  beforeEach(() => {
    process.env = { ...initialEnv }
  })

  afterAll(() => {
    process.env = initialEnv
  })

  it('should use pool url when available', () => {
    process.env.POSTGRES_PRISMA_POOL_URL = 'postgresql://pool-url'
    process.env.POSTGRES_PRISMA_URL = 'postgresql://direct-url'

    expect(getPrismaConnectionString()).toBe('postgresql://pool-url')
  })

  it('should fallback to direct url', () => {
    delete process.env.POSTGRES_PRISMA_POOL_URL
    process.env.POSTGRES_PRISMA_URL = 'postgresql://direct-url'

    expect(getPrismaConnectionString()).toBe('postgresql://direct-url')
  })

  it('should return undefined when no database url is configured', () => {
    delete process.env.POSTGRES_PRISMA_POOL_URL
    delete process.env.POSTGRES_PRISMA_URL
    process.env.NODE_ENV = 'production'

    expect(getPrismaConnectionString()).toBeUndefined()
  })

  it('should fallback to test connection string in test environment', () => {
    delete process.env.POSTGRES_PRISMA_POOL_URL
    delete process.env.POSTGRES_PRISMA_URL
    process.env.NODE_ENV = 'test'

    expect(getPrismaConnectionString()).toBe('postgresql://localhost:5432/postgres')
  })
})
