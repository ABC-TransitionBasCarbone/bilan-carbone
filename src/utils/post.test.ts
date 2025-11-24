import { BCPost, CutPost, Post, subPostsByPost, TiltPost } from '@/services/posts'
import { AdditionalResultTypes } from '@/services/study'
import { expect } from '@jest/globals'
import { Environment, SubPost } from '@prisma/client'
import { getPost, getPostValues } from './post'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../services/file', () => ({ download: jest.fn() }))
jest.mock('../services/auth', () => ({ auth: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))

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

  describe('getPost', () => {
    test('should return undefined if subPost is not defined', () => {
      expect(getPost(undefined)).toBe(undefined)
    })

    test('should return Energies for Electricite subpost', () => {
      expect(getPost(SubPost.Electricite)).toBe(Post.Energies)
    })

    test('should return Fonctionnement for Energie subpost', () => {
      expect(getPost(SubPost.Energie)).toBe(CutPost.Fonctionnement)
    })

    test('should return TransportDeMarchandises for TransportFabricationDesVehicules subpost', () => {
      expect(getPost(SubPost.TransportFabricationDesVehicules)).toBe(TiltPost.TransportDeMarchandises)
    })

    test('should return a post that includes the subPost', () => {
      Object.values(SubPost).forEach((subPost: SubPost) => {
        const res = getPost(subPost)
        if (!res) {
          throw new Error(`getPost returned undefined for subPost: ${subPost}`)
        }
        if (!subPostsByPost[res]) {
          throw new Error(`subPostsByPost[${res}] is undefined for subPost: ${subPost}`)
        }
        expect(subPostsByPost[res]).toContain(subPost)
      })
    })
  })
})
