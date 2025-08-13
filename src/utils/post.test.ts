import { BCPost, CutPost, TiltPost } from '@/services/posts'
import { AdditionalResultTypes } from '@/services/study'
import { expect } from '@jest/globals'
import { Environment } from '@prisma/client'
import { getPostValues } from './post'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../services/file', () => ({ download: jest.fn() }))
jest.mock('../services/auth', () => ({ auth: jest.fn() }))

jest.mock('../services/permissions/study', () => ({ canReadStudy: jest.fn() }))
jest.mock('./study', () => ({ getAccountRoleOnStudy: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

describe('PostUtils functions', () => {
  describe('getPostValues', () => {
    test('should return BCPost for undefined environment', () => {
      expect(getPostValues(undefined)).toBe(BCPost)
    })

    test('should return BCPost for Environment.BC', () => {
      expect(getPostValues(Environment.BC)).toBe(BCPost)
      expect(getPostValues(Environment.BC, AdditionalResultTypes.ENV_SPECIFIC_EXPORT)).toBe(BCPost)
      expect(getPostValues(Environment.BC, AdditionalResultTypes.CONSOLIDATED)).toBe(BCPost)
    })

    test('should return CutPost for Environment.CUT', () => {
      expect(getPostValues(Environment.CUT)).toBe(CutPost)
      expect(getPostValues(Environment.CUT, AdditionalResultTypes.ENV_SPECIFIC_EXPORT)).toBe(CutPost)
      expect(getPostValues(Environment.CUT, AdditionalResultTypes.CONSOLIDATED)).toBe(CutPost)
    })

    test('should return TiltPost for Environment.TILT with AdditionalResultTypes.ENV_SPECIFIC_EXPORT', () => {
      expect(getPostValues(Environment.TILT, AdditionalResultTypes.ENV_SPECIFIC_EXPORT)).toBe(TiltPost)
    })

    test('should return BCPost for Environment.TILT without AdditionalResultTypes.ENV_SPECIFIC_EXPORT', () => {
      expect(getPostValues(Environment.TILT)).toBe(BCPost)
      expect(getPostValues(Environment.TILT, AdditionalResultTypes.CONSOLIDATED)).toBe(BCPost)
    })
  })
})
