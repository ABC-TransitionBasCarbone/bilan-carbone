import * as dbAccount from '@/db/account'
import * as dbOrganization from '@/db/organization'
import { mockedOrganizationId, mockedOrganizationVersionId } from '@/tests/utils/models/organization'
import { getMockedAuthUser } from '@/tests/utils/models/user'
import * as organizationUtils from '@/utils/organization'
import { expect } from '@jest/globals'
import { Role } from '@prisma/client'
import { UserSession } from 'next-auth'
import * as authModule from '../auth'
import * as studyFunctions from '../serverFunctions/study'
import {
  canCreateOrganization,
  canDeleteOrganizationVersion,
  canUpdateOrganizationVersion,
  isInOrgaOrParentFromId,
} from './organization'

jest.mock('@/db/account', () => ({ getAccountById: jest.fn() }))
jest.mock('@/db/organization', () => ({ getOrganizationVersionById: jest.fn() }))
jest.mock('@/utils/organization', () => ({
  canEditOrganizationVersion: jest.fn(),
  hasEditionRole: jest.fn(),
  isInOrgaOrParent: jest.fn(),
}))
jest.mock('../serverFunctions/study', () => ({ getOrganizationStudiesFromOtherUsers: jest.fn() }))

// TODO : remove this mock. Should not be mocked but tests fail if not
jest.mock('../auth', () => ({ auth: jest.fn() }))

const mockGetAccountById = dbAccount.getAccountById as jest.Mock
const mockGetOrganizationVersionById = dbOrganization.getOrganizationVersionById as jest.Mock
const mockCanEditOrganizationVersion = organizationUtils.canEditOrganizationVersion as jest.Mock
const mockHasEditionRole = organizationUtils.hasEditionRole as jest.Mock
const mockIsInOrgaOrParent = organizationUtils.isInOrgaOrParent as jest.Mock
const mockGetOrganizationStudiesFromOtherUsers = studyFunctions.getOrganizationStudiesFromOtherUsers as jest.Mock
const mockAuth = authModule.auth as jest.Mock

describe('Organization permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isInOrgaOrParentFromId', () => {
    it('returns true if organization IDs match', async () => {
      const result = await isInOrgaOrParentFromId('mocked-organization-id', 'mocked-organization-id')
      expect(result).toBe(true)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(0)
    })

    it('returns true if organization is in parent chain', async () => {
      const userOrganizationId = 'user-organization-id'
      mockGetOrganizationVersionById.mockResolvedValue({ id: mockedOrganizationId, parentId: userOrganizationId })
      mockIsInOrgaOrParent.mockReturnValue(true)

      const result = await isInOrgaOrParentFromId(userOrganizationId, mockedOrganizationId)

      expect(result).toBe(true)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(1)
    })

    it('returns false if organization is not related', async () => {
      const mockedOrganizationId = 'mocked-organization-id'
      mockGetOrganizationVersionById.mockResolvedValue({ id: mockedOrganizationId })
      mockIsInOrgaOrParent.mockReturnValue(false)

      const result = await isInOrgaOrParentFromId('user-organization-id', mockedOrganizationId)

      expect(result).toBe(false)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(1)
    })
  })

  describe('canCreateOrganization', () => {
    it('returns true if user belongs to CR organization', async () => {
      mockGetAccountById.mockResolvedValue({ organizationVersionId: 'mocked-organization-version-id' })
      mockGetOrganizationVersionById.mockResolvedValue({ isCR: true })

      const result = await canCreateOrganization(getMockedAuthUser())
      expect(result).toBe(true)

      expect(mockGetAccountById).toBeCalledTimes(1)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(1)
    })

    it('returns false if user not found', async () => {
      mockGetAccountById.mockResolvedValue(null)

      const result = await canCreateOrganization(getMockedAuthUser())
      expect(result).toBe(false)

      expect(mockGetAccountById).toBeCalledTimes(1)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(0)
    })

    it('returns false if organization is not found', async () => {
      mockGetAccountById.mockResolvedValue({ organizationVersionId: 'mocked-organization-version-id' })
      mockGetOrganizationVersionById.mockResolvedValue(null)

      const result = await canCreateOrganization(getMockedAuthUser())
      expect(result).toBe(false)

      expect(mockGetAccountById).toBeCalledTimes(1)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(1)
    })

    it('returns false if organization is not CR', async () => {
      mockGetAccountById.mockResolvedValue({ organizationVersionId: 'mocked-organization-version-id' })
      mockGetOrganizationVersionById.mockResolvedValue({ isCR: false })

      const result = await canCreateOrganization(getMockedAuthUser())
      expect(result).toBe(false)

      expect(mockGetAccountById).toBeCalledTimes(1)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(1)
    })
  })

  describe('canUpdateOrganization', () => {
    it('returns true when user is from organization or parent and has editions rights', async () => {
      const mockedOrganizationVersionId = 'mocked-organization-version-id'
      const user = { email: 'mocked@email.com', organizationVersionId: mockedOrganizationVersionId } as UserSession
      mockGetAccountById.mockResolvedValue({ organizationVersionId: mockedOrganizationVersionId })
      mockGetOrganizationVersionById.mockResolvedValue({ id: mockedOrganizationVersionId })
      mockIsInOrgaOrParent.mockResolvedValue(true)
      mockCanEditOrganizationVersion.mockReturnValue(true)

      const result = await canUpdateOrganizationVersion(user, mockedOrganizationVersionId)
      expect(result).toBe(true)

      expect(mockGetAccountById).toBeCalledTimes(1)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(1)
      expect(mockIsInOrgaOrParent).toBeCalledTimes(0)
      expect(mockCanEditOrganizationVersion).toBeCalledTimes(1)
    })

    it('returns false if user not found', async () => {
      mockGetAccountById.mockResolvedValue(null)

      const result = await canUpdateOrganizationVersion(getMockedAuthUser(), mockedOrganizationId)
      expect(result).toBe(false)

      expect(mockGetAccountById).toBeCalledTimes(1)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(0)
      expect(mockIsInOrgaOrParent).toBeCalledTimes(0)
      expect(mockCanEditOrganizationVersion).toBeCalledTimes(0)
    })

    it('returns false if organization check fails', async () => {
      mockGetAccountById.mockResolvedValue({ organizationId: mockedOrganizationId })
      mockIsInOrgaOrParent.mockResolvedValue(false)

      const result = await canUpdateOrganizationVersion(
        getMockedAuthUser({ organizationId: 'user-organization-id' }),
        mockedOrganizationId,
      )
      expect(result).toBe(false)

      expect(mockGetAccountById).toBeCalledTimes(1)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(1)
      expect(mockIsInOrgaOrParent).toBeCalledTimes(1)
      expect(mockCanEditOrganizationVersion).toBeCalledTimes(0)
    })

    it('returns false if organization is not found', async () => {
      const mockedOrganizationChildId = 'mocked-organization-child-id'
      mockGetAccountById.mockResolvedValue({ organizationId: mockedOrganizationId })
      mockIsInOrgaOrParent.mockResolvedValue(true)
      mockGetOrganizationVersionById.mockImplementation((organizationId: string) => {
        if (organizationId === mockedOrganizationChildId) {
          return { parentId: mockedOrganizationId }
        } else {
          return null
        }
      })

      const result = await canUpdateOrganizationVersion(getMockedAuthUser(), mockedOrganizationChildId)
      expect(result).toBe(false)

      expect(mockGetAccountById).toBeCalledTimes(1)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(2)
      expect(mockIsInOrgaOrParent).toBeCalledTimes(1)
      expect(mockCanEditOrganizationVersion).toBeCalledTimes(0)
    })

    it('returns false if cannot edit organization', async () => {
      mockGetAccountById.mockResolvedValue({ organizationVersionId: 'mocked-organization-version-id' })
      mockGetOrganizationVersionById.mockResolvedValue({ id: 'mocked-organization-version-id' })
      mockIsInOrgaOrParent.mockResolvedValue(true)
      mockCanEditOrganizationVersion.mockReturnValue(false)

      const result = await canUpdateOrganizationVersion(getMockedAuthUser(), 'mocked-organization-version-id')
      expect(result).toBe(false)

      expect(mockGetAccountById).toBeCalledTimes(1)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(1)
      expect(mockIsInOrgaOrParent).toBeCalledTimes(0)
      expect(mockCanEditOrganizationVersion).toBeCalledTimes(1)
    })
  })

  describe('canDeleteOrganization', () => {
    it('returns true if session user can edit and is parent organization', async () => {
      mockAuth.mockResolvedValue({ user: getMockedAuthUser({ organizationVersionId: 'mocked-organization-parent' }) })
      mockGetOrganizationVersionById.mockResolvedValue({ parentId: 'mocked-organization-parent' })
      mockHasEditionRole.mockReturnValue(true)
      mockGetOrganizationStudiesFromOtherUsers.mockResolvedValue(0)

      const result = await canDeleteOrganizationVersion('mocked-organization-child')
      expect(result).toBe(true)

      expect(mockAuth).toBeCalledTimes(1)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(1)
      expect(mockHasEditionRole).toBeCalledTimes(1)
      expect(mockGetOrganizationStudiesFromOtherUsers).toBeCalledTimes(1)
    })

    it('returns false if no session', async () => {
      mockAuth.mockResolvedValue(null)
      const result = await canDeleteOrganizationVersion('mocked-organization-id')
      expect(result).toBe(false)

      expect(mockAuth).toBeCalledTimes(1)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(1)
      expect(mockHasEditionRole).toBeCalledTimes(0)
      expect(mockGetOrganizationStudiesFromOtherUsers).toBeCalledTimes(0)
    })

    it('returns false if no target', async () => {
      mockAuth.mockResolvedValue({ user: getMockedAuthUser() })
      mockGetOrganizationVersionById.mockResolvedValue(null)
      const result = await canDeleteOrganizationVersion(mockedOrganizationVersionId)
      expect(result).toBe(false)

      expect(mockAuth).toBeCalledTimes(1)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(1)
      expect(mockHasEditionRole).toBeCalledTimes(0)
      expect(mockGetOrganizationStudiesFromOtherUsers).toBeCalledTimes(0)
    })

    it('returns false if user has no edition role', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'mocked-user-id', organizationVersionId: 'mocked-organization-parent', role: 'viewer' },
      })
      mockGetOrganizationVersionById.mockResolvedValue({ parentId: 'mocked-organization-parent' })
      mockHasEditionRole.mockReturnValue(false)
      mockGetOrganizationStudiesFromOtherUsers.mockResolvedValue(0)

      const result = await canDeleteOrganizationVersion('mocked-organization-child')
      expect(result).toBe(false)

      expect(mockAuth).toBeCalledTimes(1)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(1)
      expect(mockHasEditionRole).toBeCalledTimes(1)
      expect(mockGetOrganizationStudiesFromOtherUsers).toBeCalledTimes(0)
    })

    it('returns false if studies from other users exists', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'mocked-user-id', organizationVersionId: 'mocked-organization-parent', role: 'viewer' },
      })
      mockGetOrganizationVersionById.mockResolvedValue({ parentId: 'mocked-organization-parent' })
      mockHasEditionRole.mockReturnValue(true)
      mockGetOrganizationStudiesFromOtherUsers.mockResolvedValue(1)

      const result = await canDeleteOrganizationVersion('mocked-organization-child')
      expect(result).toBe(false)
      expect(mockAuth).toBeCalledTimes(1)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(1)
      expect(mockHasEditionRole).toBeCalledTimes(1)
      expect(mockGetOrganizationStudiesFromOtherUsers).toBeCalledTimes(1)
    })

    it('returns false if target organization is not a child of user organization', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'mocked-user-id', organizationVersionId: 'mocked-user-organization-version-id', role: Role.ADMIN },
      })
      mockGetOrganizationVersionById.mockResolvedValue({ parentId: 'mocked-parent-organization-id' })
      mockHasEditionRole.mockReturnValue(true)
      mockGetOrganizationStudiesFromOtherUsers.mockResolvedValue(0)

      const result = await canDeleteOrganizationVersion('mocked-child-organization-id')
      expect(result).toBe(false)

      expect(mockAuth).toBeCalledTimes(1)
      expect(mockGetOrganizationVersionById).toBeCalledTimes(1)
      expect(mockHasEditionRole).toBeCalledTimes(1)
      expect(mockGetOrganizationStudiesFromOtherUsers).toBeCalledTimes(1)
    })
  })
})
