import { CutRoles } from '@/services/roles'
import { BASE, CUT } from '@/store/AppEnvironment'
import { getMockedAuthUser } from '@/tests/utils/models/user'
import { expect } from '@jest/globals'
import { Role, UserStatus } from '@prisma/client'
import * as organizationModule from './organization'
import { canBeUntrainedRole, findUserInfo, getEnvironmentRoles, getRoleToSetForUntrained, isAdmin } from './user'

jest.mock('./organization', () => ({ canEditMemberRole: jest.fn() }))

const mockCanEditMemberRole = organizationModule.canEditMemberRole as jest.Mock

describe('userUtils functions', () => {
  describe('isAdmin', () => {
    test('should return true for ADMIN roles', () => {
      expect(isAdmin(Role.ADMIN)).toBe(true)
      expect(isAdmin(Role.SUPER_ADMIN)).toBe(true)
    })

    test('should return false for non-ADMIN role', () => {
      expect(isAdmin(Role.GESTIONNAIRE)).toBe(false)
      expect(isAdmin(Role.COLLABORATOR)).toBe(false)
      expect(isAdmin(Role.DEFAULT)).toBe(false)
      expect(isAdmin('OTHER_ROLE' as Role)).toBe(false)
    })
  })

  describe('findUserInfo', () => {
    test('should return correct arguments for user find info when user can edit member role', () => {
      const user = getMockedAuthUser({ role: Role.ADMIN })
      mockCanEditMemberRole.mockReturnValue(true)

      const result = findUserInfo(user)
      expect(result).toEqual({
        select: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              level: true,
              status: true,
              updatedAt: true,
            },
          },
          role: true,
          updatedAt: true,
        },
        where: { organizationVersionId: user.organizationVersionId },
      })
      expect(mockCanEditMemberRole).toHaveBeenCalledWith(user)
    })

    test('should return correct arguments for user find info when user cannot edit member role', () => {
      const user = getMockedAuthUser({ role: Role.DEFAULT })
      mockCanEditMemberRole.mockReturnValue(false)

      const result = findUserInfo(user)
      expect(result).toEqual({
        select: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              level: true,
              status: true,
              updatedAt: true,
            },
          },
          role: true,
          updatedAt: true,
        },
        where: { user: { status: UserStatus.ACTIVE }, organizationVersionId: user.organizationVersionId },
      })
      expect(mockCanEditMemberRole).toHaveBeenCalledWith(user)
    })
  })

  describe('getEnvironmentRoles', () => {
    test('should return CutRoles when NEXT_PUBLIC_DEFAULT_ENVIRONMENT is CUT', () => {
      process.env.NEXT_PUBLIC_DEFAULT_ENVIRONMENT = CUT
      expect(getEnvironmentRoles()).toEqual(CutRoles)
    })

    test('should return Role when NEXT_PUBLIC_DEFAULT_ENVIRONMENT is not CUT', () => {
      process.env.NEXT_PUBLIC_DEFAULT_ENVIRONMENT = BASE
      expect(getEnvironmentRoles()).toEqual(Role)
    })
  })

  describe('getRoleToSetForUntrained', () => {
    test('should return the same role for CUT environment', () => {
      process.env.NEXT_PUBLIC_DEFAULT_ENVIRONMENT = CUT
      expect(getRoleToSetForUntrained(Role.ADMIN)).toBe(Role.ADMIN)
      expect(getRoleToSetForUntrained(Role.DEFAULT)).toBe(Role.DEFAULT)
    })

    test('should return GESTIONNAIRE for ADMIN and GESTIONNAIRE roles in BASE environment', () => {
      process.env.NEXT_PUBLIC_DEFAULT_ENVIRONMENT = BASE
      expect(getRoleToSetForUntrained(Role.ADMIN)).toBe(Role.GESTIONNAIRE)
      expect(getRoleToSetForUntrained(Role.GESTIONNAIRE)).toBe(Role.GESTIONNAIRE)
    })

    test('should return DEFAULT for other roles in BASE environment', () => {
      process.env.NEXT_PUBLIC_DEFAULT_ENVIRONMENT = BASE
      expect(getRoleToSetForUntrained(Role.COLLABORATOR)).toBe(Role.DEFAULT)
      expect(getRoleToSetForUntrained(Role.DEFAULT)).toBe(Role.DEFAULT)
    })
  })

  describe('canBeUntrainedRole', () => {
    test('should return true for all roles in CUT environment', () => {
      process.env.NEXT_PUBLIC_DEFAULT_ENVIRONMENT = CUT
      expect(canBeUntrainedRole(Role.ADMIN)).toBe(true)
      expect(canBeUntrainedRole(Role.DEFAULT)).toBe(true)
    })

    test('should return true for GESTIONNAIRE and DEFAULT roles in BASE environment', () => {
      process.env.NEXT_PUBLIC_DEFAULT_ENVIRONMENT = BASE
      expect(canBeUntrainedRole(Role.GESTIONNAIRE)).toBe(true)
      expect(canBeUntrainedRole(Role.DEFAULT)).toBe(true)
    })

    test('should return false for other roles in BASE environment', () => {
      process.env.NEXT_PUBLIC_DEFAULT_ENVIRONMENT = BASE
      expect(canBeUntrainedRole(Role.ADMIN)).toBe(false)
      expect(canBeUntrainedRole(Role.COLLABORATOR)).toBe(false)
      expect(canBeUntrainedRole(Role.SUPER_ADMIN)).toBe(false)
    })
  })
})
