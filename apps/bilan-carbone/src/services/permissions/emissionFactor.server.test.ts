import * as dbOrganization from '@/db/organization'
import * as dbUser from '@/db/user'
import { getMockedAccount } from '@/tests/utils/models/user'
import * as organizationUtils from '@/utils/organization'
import { Level, Role } from '@abc-transitionbascarbone/db-common/enums'
import { expect } from '@jest/globals'
import { canCreateEmissionFactor } from './emissionFactor.server'

jest.mock('@/db/organization', () => ({ getOrganizationVersionForRightsCheck: jest.fn() }))
jest.mock('@/db/user', () => ({ getUserById: jest.fn() }))
jest.mock('@/utils/organization', () => ({ hasActiveLicence: jest.fn() }))

const mockGetOrganizationVersionForRightsCheck = dbOrganization.getOrganizationVersionForRightsCheck as jest.Mock
const mockGetUserById = dbUser.getUserById as jest.Mock
const mockHasActiveLicence = organizationUtils.hasActiveLicence as jest.Mock

describe('canCreateEmissionFactor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([Role.ADMIN, Role.COLLABORATOR, Role.SUPER_ADMIN])(
    'allows role %s with an active licence and a level',
    async (role) => {
      const account = getMockedAccount({ role })
      mockGetUserById.mockResolvedValue({ level: Level.Initial })
      mockGetOrganizationVersionForRightsCheck.mockResolvedValue({ id: 'organization-version-id' })
      mockHasActiveLicence.mockReturnValue(true)

      await expect(canCreateEmissionFactor(account)).resolves.toBe(true)

      expect(mockGetUserById).toHaveBeenCalledWith(account.userId)
      expect(mockGetOrganizationVersionForRightsCheck).toHaveBeenCalledWith(account.organizationVersionId)
      expect(mockHasActiveLicence).toHaveBeenCalledWith({ id: 'organization-version-id' })
    },
  )

  it('denies creation when the user does not exist and skips the organization check', async () => {
    const account = getMockedAccount()
    mockGetUserById.mockResolvedValue(null)

    await expect(canCreateEmissionFactor(account)).resolves.toBe(false)

    expect(mockGetOrganizationVersionForRightsCheck).not.toHaveBeenCalled()
    expect(mockHasActiveLicence).not.toHaveBeenCalled()
  })

  it('denies creation when the organization version does not exist', async () => {
    const account = getMockedAccount()
    mockGetUserById.mockResolvedValue({ level: Level.Initial })
    mockGetOrganizationVersionForRightsCheck.mockResolvedValue(null)

    await expect(canCreateEmissionFactor(account)).resolves.toBeNull()

    expect(mockHasActiveLicence).not.toHaveBeenCalled()
  })

  it('denies creation when the licence is inactive', async () => {
    const account = getMockedAccount()
    mockGetUserById.mockResolvedValue({ level: Level.Initial })
    mockGetOrganizationVersionForRightsCheck.mockResolvedValue({ id: 'organization-version-id' })
    mockHasActiveLicence.mockReturnValue(false)

    await expect(canCreateEmissionFactor(account)).resolves.toBe(false)
  })

  it.each([Role.GESTIONNAIRE, Role.DEFAULT])(
    'denies role %s even when the licence is active and the user has a level',
    async (role) => {
      const account = getMockedAccount({ role })
      mockGetUserById.mockResolvedValue({ level: Level.Initial })
      mockGetOrganizationVersionForRightsCheck.mockResolvedValue({ id: 'organization-version-id' })
      mockHasActiveLicence.mockReturnValue(true)

      await expect(canCreateEmissionFactor(account)).resolves.toBe(false)
    },
  )

  it('denies creation when the user has no level', async () => {
    const account = getMockedAccount()
    mockGetUserById.mockResolvedValue({ level: null })
    mockGetOrganizationVersionForRightsCheck.mockResolvedValue({ id: 'organization-version-id' })
    mockHasActiveLicence.mockReturnValue(true)

    await expect(canCreateEmissionFactor(account)).resolves.toBe(false)
  })
})
