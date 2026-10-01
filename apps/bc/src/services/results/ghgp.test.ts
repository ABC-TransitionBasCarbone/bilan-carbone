import { getMockedFullStudyEmissionSource } from '@/tests/utils/models/emissionSource'
import * as studyUtilsModule from '@/utils/study'
import { EmissionFactorBase, Import, SubPost } from '@abc-transitionbascarbone/db-common/enums'
import { expect } from '@jest/globals'
import { getGHGPEmissionValue, getGHGPLineAndPost } from './ghgp'

jest.mock('../../utils/study', () => ({ hasDeprecationPeriod: jest.fn(), hasFabricationPart: jest.fn() }))
const mockHasDeprecationPeriod = studyUtilsModule.hasDeprecationPeriod as jest.Mock

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

    test('Should return emission source value if is not concerned by deprecation period', () => {
      mockHasDeprecationPeriod.mockReturnValue(false)

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

    test('Should not return emission source value if is concerned by depecration period', () => {
      mockHasDeprecationPeriod.mockReturnValue(true)

      const previousYearEmissionSource = getMockedFullStudyEmissionSource({
        value: 50,
        constructionYear: new Date('01/06/2024'),
        subPost: SubPost.Electromenager,
      })
      const result = getGHGPValue(previousYearEmissionSource)

      expect(result).toEqual(0)
      expect(previousYearEmissionSource.value).toEqual(50)
    })
  })

  describe('getGHGPLineAndPost', () => {
    const value = 100
    const emissionFactor = {
      ch4b: 0,
      ch4f: 0,
      co2b: 0,
      co2f: 0,
      n2o: 10,
      pfc: 0,
      hfc: 0,
      sf6: 0,
      otherGES: 0,
      totalCo2: 10,
      importedFrom: Import.BaseEmpreinte,
      importedId: '10250',
    }
    const post = '1.1'

    const line = {
      co2: 0,
      ch4: 0,
      n2o: 1000,
      hfc: 0,
      pfc: 0,
      sf6: 0,
      other: 0,
      co2b: 0,
      total: 1000,
    }

    test('Should return line and post if export is locationBased', () => {
      const exportBase = EmissionFactorBase.LocationBased
      const efBase = EmissionFactorBase.LocationBased

      expect(getGHGPLineAndPost(value, { ...emissionFactor, base: efBase }, post, exportBase)).toEqual({
        line,
        post,
      })
    })

    test('Should return line and post if locationBased and emissionFactor.base is null', () => {
      const exportBase = EmissionFactorBase.LocationBased
      const efBase = null

      expect(getGHGPLineAndPost(value, { ...emissionFactor, base: efBase }, post, exportBase)).toEqual({
        line,
        post,
      })
    })

    test('Should return line and post if export is marketBased and emissionFactor.base is location based and post is not scope 2', () => {
      const exportBase = EmissionFactorBase.MarketBased
      const efBase = EmissionFactorBase.LocationBased

      expect(getGHGPLineAndPost(value, { ...emissionFactor, base: efBase }, post, exportBase)).toEqual({
        line,
        post,
      })
    })

    test('Should return null if export is marketBased and emissionFactor.base is location based and post is scope 2', () => {
      const exportBase = EmissionFactorBase.MarketBased
      const efBase = EmissionFactorBase.LocationBased
      const scope2Post = '2.1'

      expect(getGHGPLineAndPost(value, { ...emissionFactor, base: efBase }, scope2Post, exportBase)).toEqual({
        line: null,
        post: null,
      })
    })

    test('Should return null if export is marketBased and emissionFactor.base is market based and is not scope 2', () => {
      const exportBase = EmissionFactorBase.MarketBased
      const efBase = EmissionFactorBase.MarketBased

      expect(getGHGPLineAndPost(value, { ...emissionFactor, base: efBase }, post, exportBase)).toEqual({
        line: null,
        post: null,
      })
    })

    test('Should return line and post if export is marketBased and emissionFactor.base is market based and is scope 2', () => {
      const exportBase = EmissionFactorBase.MarketBased
      const efBase = EmissionFactorBase.MarketBased
      const scope2Post = '2.1'

      expect(getGHGPLineAndPost(value, { ...emissionFactor, base: efBase }, scope2Post, exportBase)).toEqual({
        line,
        post: scope2Post,
      })
    })
  })
})
