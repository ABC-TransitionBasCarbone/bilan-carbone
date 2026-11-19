import { createMipEngineWithoutDefaults } from '@/lib/publicodes/mip-engine'
import mipModel, { mipSeedResponses } from '@/lib/publicodes/mip-model-seed'
import { getSurveyQuestionColumns, parseMipSimulationState } from '@/utils/survey'
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
})
