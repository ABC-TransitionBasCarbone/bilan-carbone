import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { getAccountOrganizationVersions } from './account'
import { prismaClient } from './client'
import { OrganizationVersionWithOrganizationSelect } from './organization.select'

jest.mock('./client', () => ({
  prismaClient: {
    account: { findUnique: jest.fn() },
    organizationVersion: { findMany: jest.fn() },
  },
}))
jest.mock('@/services/serverFunctions/deactivableFeatures', () => ({
  getDeactivableFeatureRestrictions: jest.fn(),
}))

const mockFindAccount = prismaClient.account.findUnique as jest.Mock
const mockFindClients = prismaClient.organizationVersion.findMany as jest.Mock
const organizationVersion = {
  id: 'professor-organization',
  isCR: false,
  environment: Environment.COURSE_BC,
  professorCourseSessions: [{ id: 'session' }],
}
const clients = [{ id: 'correction-client' }, { id: 'regular-client' }]

describe('getAccountOrganizationVersions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindAccount.mockResolvedValue({ organizationVersion })
    mockFindClients.mockResolvedValue(clients)
  })

  it.each([Environment.COURSE_BC, Environment.COURSE_TILT])(
    'includes professor clients in %s while keeping the account organization first',
    async (environment) => {
      const professorOrganization = { ...organizationVersion, environment }
      mockFindAccount.mockResolvedValue({ organizationVersion: professorOrganization })

      expect(await getAccountOrganizationVersions('account')).toEqual([professorOrganization, ...clients])
      expect(mockFindClients).toHaveBeenCalledWith({
        select: OrganizationVersionWithOrganizationSelect,
        where: { parentId: professorOrganization.id },
      })
    },
  )

  it('still includes CR clients outside training environments', async () => {
    const crOrganization = { ...organizationVersion, isCR: true, environment: Environment.BC }
    mockFindAccount.mockResolvedValue({ organizationVersion: crOrganization })
    expect(await getAccountOrganizationVersions('account')).toEqual([crOrganization, ...clients])
  })

  it.each([
    { ...organizationVersion, professorCourseSessions: [] },
    { ...organizationVersion, environment: Environment.BC },
  ])('does not expose children to non-CR accounts that are not training professors', async (organization) => {
    mockFindAccount.mockResolvedValue({ organizationVersion: organization })
    expect(await getAccountOrganizationVersions('account')).toEqual([organization])
    expect(mockFindClients).not.toHaveBeenCalled()
  })

  it.each([null, { organizationVersion: null }])('returns no organizations for %s', async (account) => {
    mockFindAccount.mockResolvedValue(account)
    expect(await getAccountOrganizationVersions('account')).toEqual([])
    expect(mockFindClients).not.toHaveBeenCalled()
  })

  it('does not query an empty account ID', async () => {
    expect(await getAccountOrganizationVersions('')).toEqual([])
    expect(mockFindAccount).not.toHaveBeenCalled()
  })
})
