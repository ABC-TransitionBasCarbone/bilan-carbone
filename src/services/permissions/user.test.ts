import { mockedOrganizationId } from '@/tests/utils/models/organization'
import { getMockedAuthUser, getMockedDbUser } from '@/tests/utils/models/user'
import * as organizationUtils from '@/utils/organization'
import { expect } from '@jest/globals'
import { Role, UserStatus } from '@prisma/client'
import { canAddMember, canChangeRole, canDeleteMember, canEditSelfRole } from './user'

jest.mock('@/utils/organization', () => ({
  canEditMemberRole: jest.fn(),
  isUntrainedRole: jest.fn(),
}))

const mockCanEditMemberRole = organizationUtils.canEditMemberRole as jest.Mock
const mockIsUntrainedRole = organizationUtils.isUntrainedRole as unknown as jest.Mock

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
    it('returns false if organizationId is null', () => {
      const result = canAddMember(adminUser, { role: Role.ADMIN }, null)
      expect(result).toBe(false)
    })

    it('returns true if user is SuperAdmin', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(
        getMockedAuthUser({ role: Role.SUPER_ADMIN, organizationId: mockedOrganizationId }),
        { role: Role.COLLABORATOR },
        mockedOrganizationId,
      )
      expect(result).toBe(true)
    })

    it('returns true if user is Admin', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(
        getMockedAuthUser({ role: Role.ADMIN, organizationId: mockedOrganizationId }),
        { role: Role.COLLABORATOR },
        mockedOrganizationId,
      )
      expect(result).toBe(true)
    })

    it('returns true if user is Gestionnaire', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(
        getMockedAuthUser({ role: Role.GESTIONNAIRE, organizationId: mockedOrganizationId }),
        { role: Role.COLLABORATOR },
        mockedOrganizationId,
      )
      expect(result).toBe(true)
    })

    it('returns false if user is Collaborator', () => {
      mockCanEditMemberRole.mockReturnValue(false)
      const result = canAddMember(
        getMockedAuthUser({ role: Role.COLLABORATOR, organizationId: mockedOrganizationId }),
        { role: Role.COLLABORATOR },
        mockedOrganizationId,
      )
      expect(result).toBe(false)
    })

    it('returns false if user is Member', () => {
      mockCanEditMemberRole.mockReturnValue(false)
      const result = canAddMember(
        getMockedAuthUser({ role: Role.DEFAULT, organizationId: mockedOrganizationId }),
        { role: Role.COLLABORATOR },
        mockedOrganizationId,
      )
      expect(result).toBe(false)
    })

    it('returns false if trying to add SUPER_ADMIN', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(adminUser, { role: Role.SUPER_ADMIN }, mockedOrganizationId)
      expect(result).toBe(false)
    })

    it('returns false if user not from same organization', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(
        getMockedAuthUser({ role: Role.ADMIN, organizationId: 'mocked-user-organization-id' }),
        { role: Role.COLLABORATOR },
        mockedOrganizationId,
      )
      expect(result).toBe(false)
    })

    it('returns true in valid conditions', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(adminUser, { role: Role.GESTIONNAIRE }, mockedOrganizationId)
      expect(result).toBe(true)
    })
  })

  describe('canDeleteMember', () => {
    it('returns false if member is null', () => {
      expect(canDeleteMember(adminUser, null)).toBe(false)
    })

    it('returns false if member is not from user organization', () => {
      const result = canDeleteMember(
        getMockedAuthUser({ role: Role.ADMIN, organizationId: 'mocked-user-organization-id' }),
        getMockedDbUser({ role: Role.ADMIN, organizationId: 'mocked-member-organization-id' }),
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).not.toBeCalled()
    })

    it('returns true if user is SuperAdmin', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canDeleteMember(
        getMockedAuthUser({ role: Role.SUPER_ADMIN }),
        getMockedDbUser({ status: UserStatus.IMPORTED }),
      )
      expect(result).toBe(true)
    })

    it('returns true if user is Admin', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canDeleteMember(
        getMockedAuthUser({ role: Role.ADMIN }),
        getMockedDbUser({ status: UserStatus.IMPORTED }),
      )
      expect(result).toBe(true)
    })

    it('returns true if user is Gestionnaire', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canDeleteMember(
        getMockedAuthUser({ role: Role.GESTIONNAIRE }),
        getMockedDbUser({ status: UserStatus.IMPORTED }),
      )
      expect(result).toBe(true)
    })

    it('returns false if user is Collaborator', () => {
      mockCanEditMemberRole.mockReturnValue(false)
      const result = canDeleteMember(
        getMockedAuthUser({ role: Role.COLLABORATOR }),
        getMockedDbUser({ status: UserStatus.IMPORTED }),
      )
      expect(result).toBe(false)
    })

    it('returns false if user is Member', () => {
      mockCanEditMemberRole.mockReturnValue(false)
      const result = canDeleteMember(
        getMockedAuthUser({ role: Role.DEFAULT }),
        getMockedDbUser({ status: UserStatus.IMPORTED }),
      )
      expect(result).toBe(false)
    })

    it('returns false if member is ACTIVE', () => {
      expect(canDeleteMember(adminUser, getMockedDbUser())).toBe(false)
    })
  })

  describe('canChangeRole', () => {
    it('returns false if member is null', () => {
      const result = canChangeRole(adminUser, null, Role.ADMIN)
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(0)
      expect(mockIsUntrainedRole).toBeCalledTimes(0)
    })

    it('returns false if editing own role without proper rights', () => {
      const collaboratorResult = canChangeRole(
        getMockedAuthUser({ id: 'mocked-user-id', role: Role.COLLABORATOR }),
        getMockedDbUser({ id: 'mocked-user-id' }),
        Role.ADMIN,
      )
      expect(collaboratorResult).toBe(false)
      const memberResult = canChangeRole(
        getMockedAuthUser({ id: 'mocked-user-id', role: Role.DEFAULT }),
        getMockedDbUser({ id: 'mocked-user-id' }),
        Role.ADMIN,
      )
      expect(memberResult).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(0)
      expect(mockIsUntrainedRole).toBeCalledTimes(0)
    })

    it('returns false if cannot edit member roles', () => {
      mockCanEditMemberRole.mockReturnValue(false)
      const result = canChangeRole(adminUser, getMockedDbUser(), Role.ADMIN)
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
      expect(mockIsUntrainedRole).toBeCalledTimes(0)
    })

    it('returns false if user is from another organization', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canChangeRole(
        adminUser,
        getMockedDbUser({ organizationId: 'mocked-other-organization-id' }),
        Role.ADMIN,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
      expect(mockIsUntrainedRole).toBeCalledTimes(0)
    })

    it('returns false if assigning SUPER_ADMIN', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canChangeRole(adminUser, getMockedDbUser(), Role.SUPER_ADMIN)
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
      expect(mockIsUntrainedRole).toBeCalledTimes(0)
    })

    it('returns false if member has no level and role is not untrained', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      mockIsUntrainedRole.mockReturnValue(false)
      const result = canChangeRole(adminUser, getMockedDbUser({ level: null }), Role.ADMIN)
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
      expect(mockIsUntrainedRole).toBeCalledTimes(1)
    })

    it('returns true when all checks pass', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      mockIsUntrainedRole.mockReturnValue(true)
      const untrainedResult = canChangeRole(adminUser, getMockedDbUser({ level: null }), Role.GESTIONNAIRE)
      expect(untrainedResult).toBe(true)
      expect(mockCanEditMemberRole).toBeCalledTimes(1)
      expect(mockIsUntrainedRole).toBeCalledTimes(1)

      mockCanEditMemberRole.mockReturnValue(true)
      mockIsUntrainedRole.mockReturnValue(false)
      const trainedResult = canChangeRole(adminUser, getMockedDbUser(), Role.ADMIN)
      expect(trainedResult).toBe(true)
      expect(mockCanEditMemberRole).toBeCalledTimes(2)
    })
  })
})
