import * as dbAccount from '@/db/account'
import * as dbOrganization from '@/db/organization'
import * as dbUser from '@/db/user'
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
  canDeleteMember,
  canDeleteOrganizationVersion,
  canUpdateOrganizationVersion,
  isInOrgaOrParentFromId,
} from './organization'

jest.mock('@/db/account', () => ({ getAccountById: jest.fn() }))
jest.mock('@/db/organization', () => ({ getOrganizationVersionById: jest.fn() }))
jest.mock('@/db/user', () => ({ getUserByEmail: jest.fn() }))
jest.mock('@/utils/organization', () => ({
  canEditMemberRole: jest.fn(),
  canEditOrganizationVersion: jest.fn(),
  hasEditionRole: jest.fn(),
  isInOrgaOrParent: jest.fn(),
}))
jest.mock('../serverFunctions/study', () => ({ getOrganizationStudiesFromOtherUsers: jest.fn() }))
jest.mock('../auth', () => ({ dbActualizedAuth: jest.fn() }))

const mockGetAccountById = dbAccount.getAccountById as jest.Mock
const mockGetOrganizationVersionById = dbOrganization.getOrganizationVersionById as jest.Mock
const mockGetUserByEmail = dbUser.getUserByEmail as jest.Mock
const mockCanEditMemberRole = organizationUtils.canEditMemberRole as jest.Mock
const mockCanEditOrganizationVersion = organizationUtils.canEditOrganizationVersion as jest.Mock
const mockHasEditionRole = organizationUtils.hasEditionRole as jest.Mock
const mockIsInOrgaOrParent = organizationUtils.isInOrgaOrParent as jest.Mock
const mockGetOrganizationStudiesFromOtherUsers = studyFunctions.getOrganizationStudiesFromOtherUsers as jest.Mock
const mockDBActualizedAuth = authModule.dbActualizedAuth as jest.Mock

describe('Organization permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isInOrgaOrParentFromId', () => {
    it('returns true if organization IDs match', async () => {
      const result = await isInOrgaOrParentFromId('mocked-organization-id', 'mocked-organization-id')
      expect(result).toBe(true)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(0)
    })

    it('returns true if organization is in parent chain', async () => {
      const userOrganizationId = 'user-organization-id'
      mockGetOrganizationVersionById.mockResolvedValue({ id: mockedOrganizationId, parentId: userOrganizationId })
      mockIsInOrgaOrParent.mockReturnValue(true)

      const result = await isInOrgaOrParentFromId(userOrganizationId, mockedOrganizationId)

      expect(result).toBe(true)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(1)
    })

    it('returns false if organization is not related', async () => {
      const mockedOrganizationId = 'mocked-organization-id'
      mockGetOrganizationVersionById.mockResolvedValue({ id: mockedOrganizationId })
      mockIsInOrgaOrParent.mockReturnValue(false)

      const result = await isInOrgaOrParentFromId('user-organization-id', mockedOrganizationId)

      expect(result).toBe(false)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(1)
    })
  })

  describe('canCreateOrganization', () => {
    it('returns true if user belongs to CR organization', async () => {
      mockGetAccountById.mockResolvedValue({ organizationVersionId: 'mocked-organization-version-id' })
      mockGetOrganizationVersionById.mockResolvedValue({ isCR: true })

      const result = await canCreateOrganization(getMockedAuthUser())
      expect(result).toBe(true)

      expect(mockGetAccountById).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(1)
    })

    it('returns false if user not found', async () => {
      mockGetAccountById.mockResolvedValue(null)

      const result = await canCreateOrganization(getMockedAuthUser())
      expect(result).toBe(false)

      expect(mockGetAccountById).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(0)
    })

    it('returns false if organization is not found', async () => {
      mockGetAccountById.mockResolvedValue({ organizationVersionId: 'mocked-organization-version-id' })
      mockGetOrganizationVersionById.mockResolvedValue(null)

      const result = await canCreateOrganization(getMockedAuthUser())
      expect(result).toBe(false)

      expect(mockGetAccountById).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(1)
    })

    it('returns false if organization is not CR', async () => {
      mockGetAccountById.mockResolvedValue({ organizationVersionId: 'mocked-organization-version-id' })
      mockGetOrganizationVersionById.mockResolvedValue({ isCR: false })

      const result = await canCreateOrganization(getMockedAuthUser())
      expect(result).toBe(false)

      expect(mockGetAccountById).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(1)
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

      expect(mockGetAccountById).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(1)
      expect(mockIsInOrgaOrParent).toHaveBeenCalledTimes(0)
      expect(mockCanEditOrganizationVersion).toHaveBeenCalledTimes(1)
    })

    it('returns false if user not found', async () => {
      mockGetAccountById.mockResolvedValue(null)

      const result = await canUpdateOrganizationVersion(getMockedAuthUser(), mockedOrganizationId)
      expect(result).toBe(false)

      expect(mockGetAccountById).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(0)
      expect(mockIsInOrgaOrParent).toHaveBeenCalledTimes(0)
      expect(mockCanEditOrganizationVersion).toHaveBeenCalledTimes(0)
    })

    it('returns false if organization check fails', async () => {
      mockGetAccountById.mockResolvedValue({ organizationId: mockedOrganizationId })
      mockIsInOrgaOrParent.mockResolvedValue(false)

      const result = await canUpdateOrganizationVersion(
        getMockedAuthUser({ organizationId: 'user-organization-id' }),
        mockedOrganizationId,
      )
      expect(result).toBe(false)

      expect(mockGetAccountById).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(1)
      expect(mockIsInOrgaOrParent).toHaveBeenCalledTimes(1)
      expect(mockCanEditOrganizationVersion).toHaveBeenCalledTimes(0)
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

      expect(mockGetAccountById).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(2)
      expect(mockIsInOrgaOrParent).toHaveBeenCalledTimes(1)
      expect(mockCanEditOrganizationVersion).toHaveBeenCalledTimes(0)
    })

    it('returns false if cannot edit organization', async () => {
      mockGetAccountById.mockResolvedValue({ organizationVersionId: 'mocked-organization-version-id' })
      mockGetOrganizationVersionById.mockResolvedValue({ id: 'mocked-organization-version-id' })
      mockIsInOrgaOrParent.mockResolvedValue(true)
      mockCanEditOrganizationVersion.mockReturnValue(false)

      const result = await canUpdateOrganizationVersion(getMockedAuthUser(), 'mocked-organization-version-id')
      expect(result).toBe(false)

      expect(mockGetAccountById).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(1)
      expect(mockIsInOrgaOrParent).toHaveBeenCalledTimes(0)
      expect(mockCanEditOrganizationVersion).toHaveBeenCalledTimes(1)
    })
  })

  describe('canDeleteOrganization', () => {
    it('returns true if session user can edit and is parent organization', async () => {
      mockDBActualizedAuth.mockResolvedValue({
        user: getMockedAuthUser({ organizationVersionId: 'mocked-organization-parent' }),
      })
      mockGetOrganizationVersionById.mockResolvedValue({ parentId: 'mocked-organization-parent' })
      mockHasEditionRole.mockReturnValue(true)
      mockGetOrganizationStudiesFromOtherUsers.mockResolvedValue({ success: true, data: 0 })

      const result = await canDeleteOrganizationVersion('mocked-organization-child')
      expect(result).toBe(true)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(1)
      expect(mockHasEditionRole).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationStudiesFromOtherUsers).toHaveBeenCalledTimes(1)
    })

    it('returns false if no session', async () => {
      mockDBActualizedAuth.mockResolvedValue(null)
      const result = await canDeleteOrganizationVersion('mocked-organization-id')
      expect(result).toBe(false)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(1)
      expect(mockHasEditionRole).toHaveBeenCalledTimes(0)
      expect(mockGetOrganizationStudiesFromOtherUsers).toHaveBeenCalledTimes(0)
    })

    it('returns false if no target', async () => {
      mockDBActualizedAuth.mockResolvedValue({ user: getMockedAuthUser() })
      mockGetOrganizationVersionById.mockResolvedValue(null)
      const result = await canDeleteOrganizationVersion(mockedOrganizationVersionId)
      expect(result).toBe(false)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(1)
      expect(mockHasEditionRole).toHaveBeenCalledTimes(0)
      expect(mockGetOrganizationStudiesFromOtherUsers).toHaveBeenCalledTimes(0)
    })

    it('returns false if user has no edition role', async () => {
      mockDBActualizedAuth.mockResolvedValue({
        user: { id: 'mocked-user-id', organizationVersionId: 'mocked-organization-parent', role: Role.COLLABORATOR },
      })
      mockGetOrganizationVersionById.mockResolvedValue({ parentId: 'mocked-organization-parent' })
      mockHasEditionRole.mockReturnValue(false)
      mockGetOrganizationStudiesFromOtherUsers.mockResolvedValue({ success: true, data: 0 })

      const result = await canDeleteOrganizationVersion('mocked-organization-child')
      expect(result).toBe(false)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(1)
      expect(mockHasEditionRole).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationStudiesFromOtherUsers).toHaveBeenCalledTimes(1)
    })

    it('returns false if studies from other users exists', async () => {
      mockDBActualizedAuth.mockResolvedValue({
        user: { id: 'mocked-user-id', organizationVersionId: 'mocked-organization-parent', role: Role.COLLABORATOR },
      })
      mockGetOrganizationVersionById.mockResolvedValue({ parentId: 'mocked-organization-parent' })
      mockHasEditionRole.mockReturnValue(true)
      mockGetOrganizationStudiesFromOtherUsers.mockResolvedValue({ success: true, data: 1 })

      const result = await canDeleteOrganizationVersion('mocked-organization-child')
      expect(result).toBe(false)
      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(1)
      expect(mockHasEditionRole).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationStudiesFromOtherUsers).toHaveBeenCalledTimes(1)
    })

    it('returns false if target organization is not a child of user organization', async () => {
      mockDBActualizedAuth.mockResolvedValue({
        user: { id: 'mocked-user-id', organizationVersionId: 'mocked-user-organization-version-id', role: Role.ADMIN },
      })
      mockGetOrganizationVersionById.mockResolvedValue({ parentId: 'mocked-parent-organization-id' })
      mockHasEditionRole.mockReturnValue(true)
      mockGetOrganizationStudiesFromOtherUsers.mockResolvedValue({ success: true, data: 0 })

      const result = await canDeleteOrganizationVersion('mocked-child-organization-id')
      expect(result).toBe(false)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionById).toHaveBeenCalledTimes(1)
      expect(mockHasEditionRole).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationStudiesFromOtherUsers).toHaveBeenCalledTimes(1)
    })
  })

  describe('canDeleteMember', () => {
    it('returns false if no session', async () => {
      mockDBActualizedAuth.mockResolvedValue(null)

      const result = await canDeleteMember('mocked-user-email')
      expect(result).toBe(false)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(0)
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(0)
    })

    it('returns false if user has no edition rights', async () => {
      mockDBActualizedAuth.mockResolvedValue({ user: getMockedAuthUser() })
      mockCanEditMemberRole.mockReturnValue(false)

      const result = await canDeleteMember(mockedOrganizationVersionId)
      expect(result).toBe(false)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(0)
    })

    it('returns false if no user is found', async () => {
      mockDBActualizedAuth.mockResolvedValue({ user: getMockedAuthUser() })
      mockCanEditMemberRole.mockReturnValue(true)
      mockGetUserByEmail.mockResolvedValue(null)

      const result = await canDeleteMember(mockedOrganizationVersionId)
      expect(result).toBe(false)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(1)
    })

    it('returns false if user tries to deleted its own account', async () => {
      mockDBActualizedAuth.mockResolvedValue({ user: getMockedAuthUser() })
      mockCanEditMemberRole.mockReturnValue(true)
      mockGetUserByEmail.mockResolvedValue({ accounts: [getMockedAuthUser()] })

      const result = await canDeleteMember(mockedOrganizationVersionId)
      expect(result).toBe(false)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(1)
    })

    it('returns false if target user is not from user organization', async () => {
      mockDBActualizedAuth.mockResolvedValue({ user: getMockedAuthUser() })
      mockCanEditMemberRole.mockReturnValue(true)
      mockGetUserByEmail.mockResolvedValue({
        accounts: [
          { ...getMockedAuthUser(), userId: 'other-user-id', organizationVersionId: 'orther-organization-version-id' },
        ],
      })

      const result = await canDeleteMember(mockedOrganizationVersionId)
      expect(result).toBe(false)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(1)
    })

    it('returns true if user has rights and target is from same organization', async () => {
      mockDBActualizedAuth.mockResolvedValue({ user: getMockedAuthUser() })
      mockCanEditMemberRole.mockReturnValue(true)
      mockGetUserByEmail.mockResolvedValue({
        accounts: [{ ...getMockedAuthUser(), userId: 'other-user-id' }],
      })

      const result = await canDeleteMember(mockedOrganizationVersionId)
      expect(result).toBe(true)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(1)
    })
  })
})
