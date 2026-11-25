import { createMipEngineWithoutDefaults, getSurveyCategoryKeysFromRawRules } from '@/lib/publicodes/mip-engine'
import mipModel, { mipSeedResponses } from '@/lib/publicodes/mip-model-seed'
import { getEntityFilterDefsFromModel } from '@/utils/entityFilter'
import {
  buildEntityFilterResults,
  createEmptyCategories,
  getSurveyQuestionColumns,
  parseMipSimulationState,
  resolveKeyStatsRules,
} from '@/utils/survey'
import { describe, expect, it } from '@jest/globals'

describe('MIP seed responses', () => {
  it('provides varied answers that can be exported and evaluated', () => {
    const columns = new Set(getSurveyQuestionColumns(mipModel).map(({ ruleName }) => ruleName))
    const engine = createMipEngineWithoutDefaults(mipModel)

    expect(mipSeedResponses).toHaveLength(15)
    expect(new Set(mipSeedResponses.map(({ situation }) => JSON.stringify(situation))).size).toBe(15)

    for (const response of mipSeedResponses) {
      const { situation } = parseMipSimulationState(JSON.stringify(response))
      expect(Object.keys(situation).length).toBeGreaterThan(0)
      expect(Object.keys(situation).every((key) => columns.has(key))).toBe(true)
      engine.setSituation(situation)
      expect(typeof engine.evaluate('bilan').nodeValue).toBe('number')
    }
  })

  it('provides representative dashboard results across all entities', () => {
    const engine = createMipEngineWithoutDefaults(mipModel)
    const situations = mipSeedResponses.map(({ situation }) => situation)
    const categories = getSurveyCategoryKeysFromRawRules(mipModel)
    const results = buildEntityFilterResults(
      situations,
      getEntityFilterDefsFromModel(mipModel),
      engine,
      categories,
      createEmptyCategories(categories),
      resolveKeyStatsRules(mipModel),
    )
    const allResults = results[0]
    const getStat = (groupKey: string, statKey: string) =>
      allResults.keyStats.find(({ key }) => key === groupKey)?.stats.find(({ key }) => key === statKey)?.value

    expect(allResults.totalRespondents).toBe(15)
    expect(results.slice(1).every(({ totalRespondents }) => totalRespondents > 0)).toBe(true)
    expect(getStat('DT', 'carModeShare')).toBe(0)
    expect(getStat('transport', 'trainModeShare')).toBe(47)
    expect(getStat('alimentation', 'vegMealsShare')).toBe(56)
    expect(getStat('alimentation', 'fullyVegetarianEmployees')).toBe(20)
    expect(getStat('divers', 'aiRequestsPerDay')).toBe(24)
    expect(getStat('divers', 'videoHoursPerDay')).toBe(2.9)
    expect(getStat('divers', 'internetHoursPerDay')).toBe(3.7)
  })
})
