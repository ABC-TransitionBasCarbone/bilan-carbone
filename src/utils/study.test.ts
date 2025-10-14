import * as StudyServiceModule from '@/services/study'
import { getMockedAuthUser } from '@/tests/utils/models/user'
import * as UserUtilsModule from '@/utils/user'
import { expect } from '@jest/globals'
import { Environment, Level, Role } from '@prisma/client'
import { getDuplicableEnvironments, getUserRoleOnPublicStudy } from './study'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../services/file', () => ({ download: jest.fn() }))
jest.mock('@/services/permissions/study', () => ({ isAdminOnStudyOrga: jest.fn() }))

jest.mock('@/services/study', () => ({ hasSufficientLevel: jest.fn() }))
jest.mock('@/utils/user', () => ({ isAdmin: jest.fn() }))

const mockHasSufficientLevel = StudyServiceModule.hasSufficientLevel as jest.Mock
const mockIsAdmin = UserUtilsModule.isAdmin as unknown as jest.Mock

const userMock = getMockedAuthUser()

describe('StudyUtils functions', () => {
  describe('getDuplicableEnvironments', () => {
    test('Should return Tilt and BC for BC environment', () => {
      const res = getDuplicableEnvironments(Environment.BC)
      expect(res.length).toBe(2)
      expect(res[0]).toContain(Environment.BC)
      expect(res[1]).toContain(Environment.TILT)
    })

    test('Should return BC and Tilt for Tilt environment', () => {
      const res = getDuplicableEnvironments(Environment.TILT)
      expect(res.length).toBe(2)
      expect(res).toContain(Environment.TILT)
      expect(res).toContain(Environment.BC)
    })

    test('Should only return Count for Count environment', () => {
      const res = getDuplicableEnvironments(Environment.CUT)
      expect(res.length).toBe(1)
      expect(res[0]).toBe(Environment.CUT)
    })
  })

  describe('getUserRoleOnPublicStudy', () => {
    it('should return Validator for admin user with sufficient level', () => {
      mockIsAdmin.mockReturnValue(true)
      mockHasSufficientLevel.mockReturnValue(true)

      const res = getUserRoleOnPublicStudy(userMock, Level.Initial)

      expect(res).toBe('Validator')
    })

    it('should return Reader for admin user with not sufficient level', () => {
      mockIsAdmin.mockReturnValue(true)
      mockHasSufficientLevel.mockReturnValue(false)

      const res = getUserRoleOnPublicStudy(userMock, Level.Initial)

      expect(res).toBe('Reader')
    })

    it('should return Editor if environment is CUT', () => {
      mockIsAdmin.mockReturnValue(false)
      const user = { ...userMock, environment: Environment.CUT }
      const res = getUserRoleOnPublicStudy(user, Level.Initial)

      expect(res).toBe('Editor')
    })

    it('should return Editor for collaborator with sufficient level in non CUT environment', () => {
      mockIsAdmin.mockReturnValue(false)
      mockHasSufficientLevel.mockReturnValue(true)
      const user = { ...userMock, role: Role.COLLABORATOR, environment: Environment.BC }

      const res = getUserRoleOnPublicStudy(user, Level.Initial)

      expect(res).toBe('Editor')
    })

    it('should return Reader for collaborator with not sufficient level in non CUT environment', () => {
      mockIsAdmin.mockReturnValue(false)
      mockHasSufficientLevel.mockReturnValue(false)
      const user = { ...userMock, role: Role.COLLABORATOR, environment: Environment.BC }

      const res = getUserRoleOnPublicStudy(user, Level.Initial)

      expect(res).toBe('Reader')
    })

    it('should return Reader for non collaborator in non CUT environment', () => {
      mockIsAdmin.mockReturnValue(false)
      const user = { ...userMock, role: Role.DEFAULT, environment: Environment.BC }

      const res = getUserRoleOnPublicStudy(user, Level.Initial)

      expect(res).toBe('Reader')
    })
  })
})
