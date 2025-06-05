import { CutRoles } from '@/services/roles'
import { getMockedAuthUser } from '@/tests/utils/models/user'
import { expect } from '@jest/globals'
import { Environment, Role, UserStatus } from '@prisma/client'
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
    test('should return CutRoles when environment is CUT', () => {
      expect(getEnvironmentRoles(Environment.CUT)).toEqual(CutRoles)
    })

    test('should return Role when environment is not CUT', () => {
      expect(getEnvironmentRoles(Environment.BC)).toEqual(Role)
    })
  })

  describe('getRoleToSetForUntrained', () => {
    test('should return the same role for CUT environment', () => {
      expect(getRoleToSetForUntrained(Role.ADMIN, Environment.CUT)).toBe(Role.ADMIN)
      expect(getRoleToSetForUntrained(Role.DEFAULT, Environment.CUT)).toBe(Role.DEFAULT)
    })

    test('should return GESTIONNAIRE for ADMIN and GESTIONNAIRE roles in BASE environment', () => {
      expect(getRoleToSetForUntrained(Role.ADMIN, Environment.BC)).toBe(Role.GESTIONNAIRE)
      expect(getRoleToSetForUntrained(Role.GESTIONNAIRE, Environment.BC)).toBe(Role.GESTIONNAIRE)
    })

    test('should return DEFAULT for other roles in BASE environment', () => {
      expect(getRoleToSetForUntrained(Role.COLLABORATOR, Environment.BC)).toBe(Role.DEFAULT)
      expect(getRoleToSetForUntrained(Role.DEFAULT, Environment.BC)).toBe(Role.DEFAULT)
    })
  })

  describe('canBeUntrainedRole', () => {
    test('should return true for all roles in CUT environment', () => {
      expect(canBeUntrainedRole(Role.ADMIN, Environment.CUT)).toBe(true)
      expect(canBeUntrainedRole(Role.DEFAULT, Environment.CUT)).toBe(true)
    })

    test('should return true for GESTIONNAIRE and DEFAULT roles in BASE environment', () => {
      expect(canBeUntrainedRole(Role.GESTIONNAIRE, Environment.BC)).toBe(true)
      expect(canBeUntrainedRole(Role.DEFAULT, Environment.BC)).toBe(true)
    })

    test('should return false for other roles in BASE environment', () => {
      expect(canBeUntrainedRole(Role.ADMIN, Environment.BC)).toBe(false)
      expect(canBeUntrainedRole(Role.COLLABORATOR, Environment.BC)).toBe(false)
      expect(canBeUntrainedRole(Role.SUPER_ADMIN, Environment.BC)).toBe(false)
    })
  })
})
