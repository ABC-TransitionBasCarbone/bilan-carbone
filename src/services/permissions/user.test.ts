import { AccountWithUser } from '@/db/account'
import { mockedOrganizationVersionId } from '@/tests/utils/models/organization'
import { getMockedAuthUser, getMockedDbAccount, mockedAccountId } from '@/tests/utils/models/user'
import * as organizationUtils from '@/utils/organization'
import * as userUtils from '@/utils/user'
import { expect } from '@jest/globals'
import { Role, UserStatus } from '@prisma/client'
import { canAddMember, canChangeRole, canDeleteMember, canEditSelfRole } from './user'

jest.mock('@/utils/organization', () => ({
  canEditMemberRole: jest.fn(),
}))
jest.mock('@/utils/user', () => ({
  canBeUntrainedRole: jest.fn(),
}))

const mockCanEditMemberRole = organizationUtils.canEditMemberRole as jest.Mock
const mockCanBeUntrainedRole = userUtils.canBeUntrainedRole as unknown as jest.Mock

const adminUser = getMockedAuthUser({ role: Role.ADMIN })

describe('User permission functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('canEditSelfRole', () => {
    it('returns false is role is Super Admin', () => {
      expect(canEditSelfRole(Role.SUPER_ADMIN)).toBe(false)
    })

    it('returns false is role is Collaborator', () => {
      expect(canEditSelfRole(Role.COLLABORATOR)).toBe(false)
    })

    it('returns false is role is Member', () => {
      expect(canEditSelfRole(Role.DEFAULT)).toBe(false)
    })

    it('returns true is role is Admin', () => {
      expect(canEditSelfRole(Role.ADMIN)).toBe(true)
    })

    it('returns true is role is Gestionnaire', () => {
      expect(canEditSelfRole(Role.GESTIONNAIRE)).toBe(true)
    })
  })

  describe('canAddMember', () => {
    it('returns false if organizationVersionId is null', () => {
      const result = canAddMember(adminUser, { role: Role.ADMIN }, null)
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(0)
    })

    it('returns true if user is SuperAdmin', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(
        getMockedAuthUser({ role: Role.SUPER_ADMIN }),
        { role: Role.COLLABORATOR },
        mockedOrganizationVersionId,
      )
      expect(result).toBe(true)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
    })

    it('returns true if user is Admin', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(
        getMockedAuthUser({ role: Role.ADMIN }),
        { role: Role.COLLABORATOR },
        mockedOrganizationVersionId,
      )
      expect(result).toBe(true)
    })

    it('returns true if user is Gestionnaire', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(
        getMockedAuthUser({ role: Role.GESTIONNAIRE }),
        { role: Role.COLLABORATOR },
        mockedOrganizationVersionId,
      )
      expect(result).toBe(true)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
    })

    it('returns false if user is Collaborator', () => {
      mockCanEditMemberRole.mockReturnValue(false)
      const result = canAddMember(
        getMockedAuthUser({ role: Role.COLLABORATOR }),
        { role: Role.COLLABORATOR },
        mockedOrganizationVersionId,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
    })

    it('returns false if user is Member', () => {
      mockCanEditMemberRole.mockReturnValue(false)
      const result = canAddMember(
        getMockedAuthUser({ role: Role.DEFAULT }),
        { role: Role.COLLABORATOR },
        mockedOrganizationVersionId,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
    })

    it('returns false if trying to add SUPER_ADMIN', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(adminUser, { role: Role.SUPER_ADMIN }, mockedOrganizationVersionId)
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
    })

    it('returns false if user not from same organization', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(
        getMockedAuthUser({ role: Role.ADMIN, organizationVersionId: 'mocked-user-organization-id' }),
        { role: Role.COLLABORATOR },
        mockedOrganizationVersionId,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
    })

    it('returns true when has rights, target is not SUPER_ADMIN and organization matches', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(adminUser, { role: Role.GESTIONNAIRE }, mockedOrganizationVersionId)
      expect(result).toBe(true)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
    })
  })

  describe('canDeleteMember', () => {
    it('returns false if member is null', () => {
      expect(canDeleteMember(adminUser, null)).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(0)
    })

    it('returns false if member is not from user organization', () => {
      const result = canDeleteMember(
        getMockedAuthUser({ role: Role.ADMIN, organizationVersionId: 'mocked-user-organization-version-id' }),
        getMockedDbAccount({ role: Role.ADMIN }) as AccountWithUser,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(0)
    })

    it('returns true if user is SuperAdmin', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canDeleteMember(
        getMockedAuthUser({ role: Role.SUPER_ADMIN }),
        getMockedDbAccount({}, { status: UserStatus.IMPORTED }) as AccountWithUser,
      )
      expect(result).toBe(true)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
    })

    it('returns true if user is Admin', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canDeleteMember(
        getMockedAuthUser({ role: Role.ADMIN }),
        getMockedDbAccount({}, { status: UserStatus.IMPORTED }) as AccountWithUser,
      )
      expect(result).toBe(true)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
    })

    it('returns true if user is Gestionnaire', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canDeleteMember(
        getMockedAuthUser({ role: Role.GESTIONNAIRE }),
        getMockedDbAccount({}, { status: UserStatus.IMPORTED }) as AccountWithUser,
      )
      expect(result).toBe(true)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
    })

    it('returns false if user is Collaborator', () => {
      mockCanEditMemberRole.mockReturnValue(false)
      const result = canDeleteMember(
        getMockedAuthUser({ role: Role.COLLABORATOR }),
        getMockedDbAccount({}, { status: UserStatus.IMPORTED }) as AccountWithUser,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
    })

    it('returns false if user is Member', () => {
      mockCanEditMemberRole.mockReturnValue(false)
      const result = canDeleteMember(
        getMockedAuthUser({ role: Role.DEFAULT }),
        getMockedDbAccount({}, { status: UserStatus.IMPORTED }) as AccountWithUser,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
    })

    it('returns false if member is ACTIVE', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canDeleteMember(
        getMockedAuthUser({ role: Role.DEFAULT }),
        getMockedDbAccount({}, { status: UserStatus.ACTIVE }) as AccountWithUser,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
    })
  })

  describe('canChangeRole', () => {
    it('returns false if member is null', () => {
      const result = canChangeRole(adminUser, null, Role.ADMIN)
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(0)
      expect(mockCanBeUntrainedRole).toBeCalledTimes(0)
    })

    it('returns false if editing own role without proper rights', () => {
      const collaboratorResult = canChangeRole(
        getMockedAuthUser({ id: 'mocked-user-id', accountId: 'mocked-account-id', role: Role.COLLABORATOR }),
        getMockedDbAccount({ id: 'mocked-account-id' }) as AccountWithUser,
        Role.ADMIN,
      )
      expect(collaboratorResult).toBe(false)
      const memberResult = canChangeRole(
        getMockedAuthUser({ id: mockedAccountId, role: Role.DEFAULT }),
        getMockedDbAccount({ id: mockedAccountId }) as AccountWithUser,
        Role.ADMIN,
      )
      expect(memberResult).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(0)
      expect(mockCanBeUntrainedRole).toBeCalledTimes(0)
    })

    it('returns false if cannot edit member roles', () => {
      mockCanEditMemberRole.mockReturnValue(false)
      const result = canChangeRole(adminUser, getMockedDbAccount() as AccountWithUser, Role.ADMIN)
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
      expect(mockCanBeUntrainedRole).toBeCalledTimes(0)
    })

    it('returns false if user is from another organization', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canChangeRole(
        adminUser,
        getMockedDbAccount({ organizationVersionId: 'mocked-other-organization-id' }) as AccountWithUser,
        Role.ADMIN,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
      expect(mockCanBeUntrainedRole).toBeCalledTimes(0)
    })

    it('returns false if assigning SUPER_ADMIN', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canChangeRole(adminUser, getMockedDbAccount() as AccountWithUser, Role.SUPER_ADMIN)
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
      expect(mockCanBeUntrainedRole).toBeCalledTimes(0)
    })

    it('returns false if member has no level and role is not untrained', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      mockCanBeUntrainedRole.mockReturnValue(false)
      const result = canChangeRole(adminUser, getMockedDbAccount({}, { level: null }) as AccountWithUser, Role.ADMIN)
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
      expect(mockCanBeUntrainedRole).toBeCalledTimes(1)
    })

    it('returns true when all checks pass', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      mockCanBeUntrainedRole.mockReturnValue(true)
      const untrainedResult = canChangeRole(
        adminUser,
        getMockedDbAccount({}, { level: null }) as AccountWithUser,
        Role.GESTIONNAIRE,
      )
      expect(untrainedResult).toBe(true)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
      expect(mockCanBeUntrainedRole).toBeCalledTimes(1)

      mockCanEditMemberRole.mockReturnValue(true)
      mockCanBeUntrainedRole.mockReturnValue(false)
      const trainedResult = canChangeRole(adminUser, getMockedDbAccount() as AccountWithUser, Role.ADMIN)
      expect(trainedResult).toBe(true)
      expect(mockCanEditMemberRole).toBeCalledTimes(2)
    })
  })
})
