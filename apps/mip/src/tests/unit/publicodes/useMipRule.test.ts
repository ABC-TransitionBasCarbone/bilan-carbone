import { createMipEngine } from '@/lib/publicodes/mip-engine'
import { getFormQuestions, getRulesMeta, getStableQuestionOrder } from '@/lib/publicodes/mip-rules'
import { useMipPublicodes } from '@/lib/publicodes/MipPublicodesProvider'
import { useMipRule } from '@/lib/publicodes/useMipRule'
import { MipSimulationState } from '@/utils/survey'
import { beforeEach, describe, expect, it } from '@jest/globals'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

jest.mock('@/lib/publicodes/MipPublicodesProvider', () => ({
  useMipPublicodes: () => mockPublicodes,
}))

let mockPublicodes: Pick<
  ReturnType<typeof useMipPublicodes>,
  | 'engine'
  | 'meta'
  | 'simulation'
  | 'currentQuestion'
  | 'setCurrentQuestion'
  | 'updateSimulation'
  | 'safeEvaluate'
  | 'safeGetRule'
>

type MipRuleResult = ReturnType<typeof useMipRule>

const MipRuleHarness = ({ ruleName, ruleRef }: { ruleName: string; ruleRef: { current: MipRuleResult | null } }) => {
  ruleRef.current = useMipRule(ruleName)
  return null
}

const voiture = 'DT . voiture . présent'
const train = 'DT . train . présent'

describe('MIP answer updates', () => {
  beforeEach(() => {
    const engine = createMipEngine({
      bilan: { somme: ['DT', 'alimentation'] },
      DT: {
        question: 'Transport ?',
        somme: ['voiture', 'train'],
        mosaique: { type: 'selection', options: ['voiture . présent', 'train . présent'] },
      },
      'DT . voiture': { 'applicable si': 'présent', valeur: 'km' },
      [voiture]: { question: 'Voiture ?', 'par défaut': 'non' },
      'DT . voiture . km': { question: 'Distance voiture ?', 'par défaut': 100 },
      'DT . train': { 'applicable si': 'présent', valeur: 'km' },
      [train]: { question: 'Train ?', 'par défaut': 'non' },
      'DT . train . km': { question: 'Distance train ?', 'par défaut': 100 },
      alimentation: { question: 'Repas ?', 'par défaut': 5 },
    })
    const situation = { [voiture]: 'oui', [train]: 'oui', alimentation: 3 }
    engine.setSituation(situation)
    mockPublicodes = {
      engine,
      meta: getRulesMeta(engine),
      simulation: { situation, foldedSteps: [], actionChoices: {}, progression: 0, questionOrder: [] },
      currentQuestion: 'DT',
      setCurrentQuestion: jest.fn(),
      updateSimulation: jest.fn((updates: Partial<MipSimulationState>) => {
        if (updates.situation) {
          engine.setSituation(updates.situation)
        }
      }),
      safeEvaluate: (ruleName) => engine.evaluate(ruleName),
      safeGetRule: (ruleName) => engine.getParsedRules()[ruleName],
    }
  })

  it('clears every selected mosaic option without overwriting earlier answers or advancing', () => {
    const root = createRoot(document.createElement('div'))
    const ruleRef: { current: MipRuleResult | null } = { current: null }
    act(() => root.render(createElement(MipRuleHarness, { ruleName: 'DT', ruleRef })))
    const rule = ruleRef.current
    if (!rule) {
      throw new Error('useMipRule did not render')
    }

    act(() => {
      rule.setValue(false, voiture)
      rule.setValue(false, train)
    })
    act(() => root.unmount())

    expect(mockPublicodes.engine.getSituation()).toEqual({ [voiture]: 'non', [train]: 'non', alimentation: 3 })
    expect(mockPublicodes.setCurrentQuestion).not.toHaveBeenCalled()
    expect(getFormQuestions(mockPublicodes.engine, mockPublicodes.meta, []).relevantQuestions).toEqual([
      'DT',
      'alimentation',
    ])
  })

  it('keeps new mosaic follow-ups together after their parent and before the next category', () => {
    const { engine, meta } = mockPublicodes
    engine.setSituation({ alimentation: 3 })
    const previousOrder = getFormQuestions(engine, meta, []).relevantQuestions
    const root = createRoot(document.createElement('div'))
    const ruleRef: { current: MipRuleResult | null } = { current: null }
    act(() => root.render(createElement(MipRuleHarness, { ruleName: 'DT', ruleRef })))
    const rule = ruleRef.current
    if (!rule) {
      throw new Error('useMipRule did not render')
    }

    act(() => {
      rule.setValue(true, voiture)
      rule.setValue(true, train)
    })
    act(() => root.unmount())
    const questions = getFormQuestions(engine, meta, [])

    expect(engine.getSituation()).toEqual({ alimentation: 3, [voiture]: 'oui', [train]: 'oui' })
    expect(
      getStableQuestionOrder(
        previousOrder,
        'DT',
        questions.relevantQuestions,
        questions.relevantQuestions,
        meta.mosaicChildrenWithParent,
      ),
    ).toEqual(['DT', 'DT . voiture . km', 'DT . train . km', 'alimentation'])
  })
})
