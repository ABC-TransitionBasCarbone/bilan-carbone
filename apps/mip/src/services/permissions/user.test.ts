import { getMockedAuthUser, getMockedDbAccountMip, mockedAccountMipId } from '@/tests/utils/models/user'
import { AccountMipWithUser } from '@/types/accountMip.types'
import * as userUtils from '@/utils/user'
import { Role } from '@abc-transitionbascarbone/db-common/enums'
import { expect } from '@jest/globals'
import { canChangeRole } from './user'

jest.mock('@/utils/user', () => ({
  canEditMemberRole: jest.fn(),
}))

const mockCanEditMemberRole = userUtils.canEditMemberRole as jest.Mock

const adminUser = getMockedAuthUser({ role: Role.ADMIN })

const otherAccountId = 'mocked-other-account-mip-id'

describe('User permission functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('canChangeRole', () => {
    it('returns false if member is null', () => {
      const result = canChangeRole(adminUser, null, Role.ADMIN)
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(0)
    })

    it('returns false if editing own role', () => {
      const collaboratorResult = canChangeRole(
        getMockedAuthUser({ id: 'mocked-user-id', accountMipId: 'mocked-account-mip-id', role: Role.ADMIN }),
        getMockedDbAccountMip({ id: 'mocked-account-mip-id' }) as AccountMipWithUser,
        Role.GESTIONNAIRE,
      )
      expect(collaboratorResult).toBe(false)
      const memberResult = canChangeRole(
        getMockedAuthUser({ id: mockedAccountMipId, role: Role.DEFAULT }),
        getMockedDbAccountMip({ id: mockedAccountMipId }) as AccountMipWithUser,
        Role.ADMIN,
      )
      expect(memberResult).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(0)
    })

    it('returns false if cannot edit member roles', () => {
      mockCanEditMemberRole.mockReturnValue(false)
      const result = canChangeRole(
        adminUser,
        getMockedDbAccountMip({ id: otherAccountId }) as AccountMipWithUser,
        Role.ADMIN,
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
        Role.ADMIN,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
    })

    it('returns false if assigning SUPER_ADMIN', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const result = canChangeRole(
        adminUser,
        getMockedDbAccountMip({ id: otherAccountId }) as AccountMipWithUser,
        Role.SUPER_ADMIN,
      )
      expect(result).toBe(false)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
    })

    it('returns true when all checks pass', () => {
      mockCanEditMemberRole.mockReturnValue(true)
      const untrainedResult = canChangeRole(
        adminUser,
        getMockedDbAccountMip({ id: otherAccountId }, { level: null }) as AccountMipWithUser,
        Role.GESTIONNAIRE,
      )
      expect(untrainedResult).toBe(true)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)

      mockCanEditMemberRole.mockReturnValue(true)
      const trainedResult = canChangeRole(
        adminUser,
        getMockedDbAccountMip({ id: otherAccountId }) as AccountMipWithUser,
        Role.ADMIN,
      )
      expect(trainedResult).toBe(true)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(2)
    })
  })
})
