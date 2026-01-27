import { getMockedFullStudyEmissionSource } from '@/tests/utils/models/emissionSource'
import * as studyUtilsModule from '@/utils/study'
import { expect } from '@jest/globals'
import { getGHGPEmissionValue } from './ghgp'

jest.mock('../../utils/study', () => ({ hasDeprecationPeriod: jest.fn(), isFabrication: jest.fn() }))
const mockHasDeprecationPeriod = studyUtilsModule.hasDeprecationPeriod as jest.Mock
const mockIsFabrication = studyUtilsModule.isFabrication as jest.Mock

const getGHGPValue = getGHGPEmissionValue(new Date('01/06/2025'))

describe('GHGP service functions', () => {
  describe('getGHGPEmissionValue', () => {
    test('Should return 0 if emission source value not defined', () => {
      const withNullValue = getMockedFullStudyEmissionSource({
        value: null,
        constructionYear: new Date('01/09/2025'),
      })
      const nullResult = getGHGPValue(withNullValue)
      expect(nullResult).toEqual(0)

      const withUndefinedValue = getMockedFullStudyEmissionSource({
        value: null,
        constructionYear: new Date('01/09/2025'),
      })
      const undefinedResult = getGHGPValue(withUndefinedValue)
      expect(undefinedResult).toEqual(0)
    })

    test('Should return 0 if construction year is not the studyYear', () => {
      mockHasDeprecationPeriod.mockReturnValue(true)
      const emissionSource = getMockedFullStudyEmissionSource({
        value: 100,
        constructionYear: new Date('01/06/2024'),
      })
      const result = getGHGPValue(emissionSource)

      expect(result).toEqual(0)
    })

    test('Should return emission source value if construction year is the studyYear', () => {
      mockHasDeprecationPeriod.mockReturnValue(true)

      const emissionSource = getMockedFullStudyEmissionSource({
        value: 100,
        constructionYear: new Date('01/09/2025'),
      })
      const result = getGHGPValue(emissionSource)

      expect(result).toEqual(emissionSource.value)
      expect(emissionSource.value).toEqual(100)
    })

    test('Should return emission source value if is not concerned by deprecation period or fabrication', () => {
      mockHasDeprecationPeriod.mockReturnValue(false)
      mockIsFabrication.mockReturnValue(false)

      const previousYearEmissionSource = getMockedFullStudyEmissionSource({
        value: 50,
        constructionYear: new Date('01/06/2024'),
      })
      const result = getGHGPValue(previousYearEmissionSource)

      expect(result).toEqual(previousYearEmissionSource.value)
      expect(previousYearEmissionSource.value).toEqual(50)

      const sameYearEmissionSource = getMockedFullStudyEmissionSource({
        value: 99,
        constructionYear: new Date('01/09/2025'),
      })
      const defaultResult = getGHGPValue(sameYearEmissionSource)

      expect(defaultResult).toEqual(sameYearEmissionSource.value)
      expect(sameYearEmissionSource.value).toEqual(99)
    })
  })
})
