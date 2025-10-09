import { expect } from '@jest/globals'
import { Environment } from '@prisma/client'
import { getDuplicableEnvironments } from './study'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../services/file', () => ({ download: jest.fn() }))
jest.mock('@/services/permissions/study', () => ({ isAdminOnStudyOrga: jest.fn() }))
jest.mock('@/services/study', () => ({ hasSufficientLevel: jest.fn() }))

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
})
