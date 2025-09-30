import { expect } from '@jest/globals'
import { Environment } from '@prisma/client'
import { getDuplicableEnvironments } from './study'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../services/file', () => ({ download: jest.fn() }))
jest.mock('@/services/permissions/study', () => ({ isAdminOnStudyOrga: jest.fn() }))
jest.mock('@/services/study', () => ({ checkLevel: jest.fn() }))

describe('StudyUtils functions', () => {
  describe('getDuplicableEnvironments', () => {
    test('should return Tilt for BC environment', () => {
      const res = getDuplicableEnvironments(Environment.BC)
      expect(res.length).toBe(1)
      expect(res[0]).toBe(Environment.TILT)
    })

    test('should return BC for Tilt environment', () => {
      const res = getDuplicableEnvironments(Environment.TILT)
      expect(res.length).toBe(1)
      expect(res[0]).toBe(Environment.BC)
    })

    test('should return nothing for Count environment', () => {
      const res = getDuplicableEnvironments(Environment.CUT)
      expect(res.length).toBe(0)
    })
  })
})
