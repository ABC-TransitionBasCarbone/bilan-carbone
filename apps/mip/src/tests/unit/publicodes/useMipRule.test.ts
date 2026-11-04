import { createMipEngine } from '@/lib/publicodes/mip-engine'
import { getFormQuestions, getRulesMeta, getStableQuestionOrder } from '@/lib/publicodes/mip-rules'
import { useMipPublicodes } from '@/lib/publicodes/MipPublicodesProvider'
import { useMipForm } from '@/lib/publicodes/useMipForm'
import { useMipRule } from '@/lib/publicodes/useMipRule'
import { MipSimulationState } from '@/utils/survey'
import { beforeEach, describe, expect, it } from '@jest/globals'
import seedModel from '../../../../prisma/seed/co2-model.FR-lang.fr-opti.json'

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
    const rule = useMipRule('DT')
    rule.setValue(false, voiture)
    rule.setValue(false, train)

    expect(mockPublicodes.engine.getSituation()).toEqual({ [voiture]: 'non', [train]: 'non', alimentation: 3 })
    expect(mockPublicodes.setCurrentQuestion).not.toHaveBeenCalled()
    expect(getFormQuestions(mockPublicodes.engine, mockPublicodes.meta, []).relevantQuestions).toEqual([
      'DT',
      'alimentation',
    ])
  })

  it('navigates to same-car after skipping the professional distance', () => {
    const engine = createMipEngine(seedModel)
    const meta = getRulesMeta(engine)
    engine.setSituation({
      'DT . voiture . présent': 'oui',
      'DT . voiture . utilisateur': "'propriétaire'",
      'transport . voiture . présent': 'oui',
    })
    mockPublicodes.engine = engine
    mockPublicodes.meta = meta
    mockPublicodes.currentQuestion = 'transport . voiture . km'
    mockPublicodes.simulation.foldedSteps = ['DT . voiture . km']
    mockPublicodes.simulation.questionOrder = getFormQuestions(engine, meta, ['DT . voiture . km']).relevantQuestions

    useMipForm().goToNextQuestion()

    expect(mockPublicodes.setCurrentQuestion).toHaveBeenCalledWith('transport . voiture . meme voiture')
  })

  it('can skip a defaulted car motorization choice', () => {
    const engine = createMipEngine(seedModel)
    const meta = getRulesMeta(engine)
    engine.setSituation({
      'DT . voiture . présent': 'oui',
      'DT . voiture . utilisateur': "'propriétaire'",
      'transport . voiture . présent': 'oui',
      'transport . voiture . meme voiture': 'non',
    })
    mockPublicodes.engine = engine
    mockPublicodes.meta = meta
    mockPublicodes.currentQuestion = 'transport . voiture . motorisation'
    mockPublicodes.simulation.foldedSteps = ['DT . voiture . km', 'transport . voiture . km']
    mockPublicodes.simulation.questionOrder = getFormQuestions(
      engine,
      meta,
      mockPublicodes.simulation.foldedSteps,
    ).relevantQuestions

    useMipForm().goToNextQuestion()

    expect(mockPublicodes.updateSimulation).toHaveBeenCalled()
    expect(mockPublicodes.setCurrentQuestion).toHaveBeenCalled()
    expect(mockPublicodes.setCurrentQuestion).not.toHaveBeenCalledWith('transport . voiture . motorisation')
  })

  it('keeps new mosaic follow-ups together after their parent and before the next category', () => {
    const { engine, meta } = mockPublicodes
    engine.setSituation({ alimentation: 3 })
    const previousOrder = getFormQuestions(engine, meta, []).relevantQuestions
    const rule = useMipRule('DT')
    rule.setValue(true, voiture)
    rule.setValue(true, train)
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
