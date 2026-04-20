import { getPrismaConnectionString } from './prismaConnectionString'

describe('getPrismaConnectionString', () => {
  const initialEnv = process.env
  const initialArgv = process.argv

  beforeEach(() => {
    process.env = { ...initialEnv }
    process.argv = [...initialArgv]
  })

  afterAll(() => {
    process.env = initialEnv
    process.argv = initialArgv
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
    process.env = { ...process.env, NODE_ENV: 'production' }
    delete process.env.JEST_WORKER_ID
    delete process.env.npm_lifecycle_event

    expect(getPrismaConnectionString()).toBeUndefined()
  })

  it('should fallback to test connection string in test environment', () => {
    delete process.env.POSTGRES_PRISMA_POOL_URL
    delete process.env.POSTGRES_PRISMA_URL
    process.env = { ...process.env, NODE_ENV: 'test' }

    expect(getPrismaConnectionString()).toBe('postgresql://localhost:5432/postgres')
  })

  it('should fallback to test connection string when running in jest', () => {
    delete process.env.POSTGRES_PRISMA_POOL_URL
    delete process.env.POSTGRES_PRISMA_URL
    process.env = { ...process.env, NODE_ENV: 'production', JEST_WORKER_ID: '1' }

    expect(getPrismaConnectionString()).toBe('postgresql://localhost:5432/postgres')
  })

  it('should fallback to test connection string when running yarn test', () => {
    delete process.env.POSTGRES_PRISMA_POOL_URL
    delete process.env.POSTGRES_PRISMA_URL
    process.env = { ...process.env, NODE_ENV: 'production', npm_lifecycle_event: 'test' }
    delete process.env.JEST_WORKER_ID

    expect(getPrismaConnectionString()).toBe('postgresql://localhost:5432/postgres')
  })

  it('should fallback to test connection string when jest is in argv', () => {
    delete process.env.POSTGRES_PRISMA_POOL_URL
    delete process.env.POSTGRES_PRISMA_URL
    process.env = { ...process.env, NODE_ENV: 'production' }
    delete process.env.JEST_WORKER_ID
    delete process.env.npm_lifecycle_event
    process.argv = ['node', 'jest']

    expect(getPrismaConnectionString()).toBe('postgresql://localhost:5432/postgres')
  })
})
