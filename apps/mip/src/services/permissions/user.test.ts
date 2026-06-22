import { mockedOrganizationVersionMipId } from '@/tests/utils/models/organization'
import { getMockedAuthUser, getMockedDbAccountMip, mockedAccountMipId } from '@/tests/utils/models/user'
import { AccountMipWithUser } from '@/types/accountMip.types'
import * as userUtils from '@/utils/user'
import { RoleMip, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { expect } from '@jest/globals'
import { canAddMember, canChangeRole, canDeleteMember } from './user'

jest.mock('@/utils/user', () => ({
  canEditMemberRole: jest.fn(),
}))

const mockCanEditMemberRole = userUtils.canEditMemberRole as jest.Mock

const adminUser = getMockedAuthUser({ role: RoleMip.ADMIN })

const otherAccountId = 'mocked-other-account-mip-id'

describe('User permission functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('canChangeRole', () => {
    it('returns false if member is null', () => {
      const result = canChangeRole(adminUser, null, RoleMip.ADMIN)
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(0)
    })

    it('returns false if editing own role', () => {
      const collaboratorResult = canChangeRole(
        getMockedAuthUser({ id: 'mocked-user-id', accountMipId: 'mocked-account-mip-id', role: RoleMip.ADMIN }),
        getMockedDbAccountMip({ id: 'mocked-account-mip-id' }) as AccountMipWithUser,
        RoleMip.COLLABORATOR,
      )
      expect(collaboratorResult).toBe(false)
      const memberResult = canChangeRole(
        getMockedAuthUser({ id: mockedAccountMipId, role: RoleMip.COLLABORATOR }),
        getMockedDbAccountMip({ id: mockedAccountMipId }) as AccountMipWithUser,
        RoleMip.ADMIN,
      )
      expect(memberResult).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(0)
    })

    it('returns false if cannot edit member roles', () => {
      mockCanEditMemberRole.mockReturnValue(false)
      const result = canChangeRole(
        adminUser,
        getMockedDbAccountMip({ id: otherAccountId }) as AccountMipWithUser,
        RoleMip.ADMIN,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
    })

    it('returns false if user is from another organization', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canChangeRole(
        adminUser,
        getMockedDbAccountMip({
          id: otherAccountId,
          organizationVersionMipId: 'mocked-other-organization-id',
        }) as AccountMipWithUser,
        RoleMip.ADMIN,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
    })

    it('returns false if assigning SUPER_ADMIN', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canChangeRole(
        adminUser,
        getMockedDbAccountMip({ id: otherAccountId }) as AccountMipWithUser,
        RoleMip.SUPER_ADMIN,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
    })

    it('returns true when all checks pass', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const untrainedResult = canChangeRole(
        adminUser,
        getMockedDbAccountMip({ id: otherAccountId }, { level: null }) as AccountMipWithUser,
        RoleMip.COLLABORATOR,
      )
      expect(untrainedResult).toBe(true)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)

      mockCanEditMemberRole.mockReturnValue(true)
      const trainedResult = canChangeRole(
        adminUser,
        getMockedDbAccountMip({ id: otherAccountId }) as AccountMipWithUser,
        RoleMip.ADMIN,
      )
      expect(trainedResult).toBe(true)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(2)
    })
  })

  describe('canAddMember', () => {
    it('returns false if organizationVersionMipId is null', () => {
      const result = canAddMember(adminUser, { role: RoleMip.ADMIN }, null)
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(0)
    })

    it('returns true if user is SuperAdmin', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(
        getMockedAuthUser({ role: RoleMip.SUPER_ADMIN }),
        { role: RoleMip.COLLABORATOR },
        mockedOrganizationVersionMipId,
      )
      expect(result).toBe(true)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
    })

    it('returns true if user is Admin', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(
        getMockedAuthUser({ role: RoleMip.ADMIN }),
        { role: RoleMip.COLLABORATOR },
        mockedOrganizationVersionMipId,
      )
      expect(result).toBe(true)
    })

    it('returns false if user is Collaborator', () => {
      mockCanEditMemberRole.mockReturnValue(false)
      const result = canAddMember(
        getMockedAuthUser({ role: RoleMip.COLLABORATOR }),
        { role: RoleMip.COLLABORATOR },
        mockedOrganizationVersionMipId,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
    })

    it('returns false if trying to add SUPER_ADMIN', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(adminUser, { role: RoleMip.SUPER_ADMIN }, mockedOrganizationVersionMipId)
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
    })

    it('returns false if user not from same organization', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(
        getMockedAuthUser({ role: RoleMip.ADMIN, organizationVersionMipId: 'mocked-user-organization-id' }),
        { role: RoleMip.COLLABORATOR },
        mockedOrganizationVersionMipId,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
    })

    it('returns true when has rights, target is not SUPER_ADMIN and organization matches', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canAddMember(adminUser, { role: RoleMip.ADMIN }, mockedOrganizationVersionMipId)
      expect(result).toBe(true)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
    })
  })

  describe('canDeleteMember', () => {
    it('returns false if member is null', () => {
      expect(canDeleteMember(adminUser, null)).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(0)
    })

    it('returns false if member is not from user organization', () => {
      const result = canDeleteMember(
        getMockedAuthUser({ role: RoleMip.ADMIN, organizationVersionMipId: 'mocked-user-organization-version-id' }),
        getMockedDbAccountMip({ role: RoleMip.ADMIN }) as AccountMipWithUser,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(0)
    })

    it('returns true if user is SuperAdmin', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canDeleteMember(
        getMockedAuthUser({ role: RoleMip.SUPER_ADMIN }),
        getMockedDbAccountMip({ status: UserStatus.IMPORTED }) as AccountMipWithUser,
      )
      expect(result).toBe(true)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
    })

    it('returns true if user is Admin', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canDeleteMember(
        getMockedAuthUser({ role: RoleMip.ADMIN }),
        getMockedDbAccountMip({ status: UserStatus.IMPORTED }) as AccountMipWithUser,
      )
      expect(result).toBe(true)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
    })

    it('returns false if user is Collaborator', () => {
      mockCanEditMemberRole.mockReturnValue(false)
      const result = canDeleteMember(
        getMockedAuthUser({ role: RoleMip.COLLABORATOR }),
        getMockedDbAccountMip({ status: UserStatus.IMPORTED }) as AccountMipWithUser,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
    })
  })
})
