import { getLocale } from '@/i18n/locale'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { Locale } from '@abc-transitionbascarbone/i18n/config'
import { getAllActualitiesLocale, getMainActualitiesLocale } from './actuality.server'
import { prismaClient } from './client.server'

jest.mock('@/i18n/locale', () => ({
  getLocale: jest.fn(),
}))

jest.mock('./client.server', () => ({
  prismaClient: {
    actuality: {
      findMany: jest.fn(),
    },
  },
}))

const mockFindMany = jest.mocked(prismaClient.actuality.findMany)
const mockGetLocale = jest.mocked(getLocale)

describe('Actuality queries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetLocale.mockResolvedValue(Locale.FR)
    mockFindMany.mockResolvedValue([])
  })

  it('filters the full list by locale and environment', async () => {
    await getAllActualitiesLocale(Environment.TILT)

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { language: Locale.FR, environment: Environment.TILT },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('filters homepage actualities by environment before limiting the result', async () => {
    await getMainActualitiesLocale(Environment.CUT)

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { language: Locale.FR, environment: Environment.CUT },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })
  })
})
