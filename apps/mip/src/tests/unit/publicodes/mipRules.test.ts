import { buildGroupedElements } from '@/components/survey/surveyGrouping'
import { createMipEngine } from '@/publicodes/mip-engine'
import {
  getActions,
  getFormQuestions,
  getMosaicResetSituation,
  getNextQuestion,
  getPlancherWarning,
  getQuestionType,
  getRulesMeta,
  getSituationWithQuestionDefaults,
  getSomme,
  getStableQuestionOrder,
  MipQuestionType,
  sortQuestions,
} from '@/publicodes/mip-rules'
import { describe, expect, it } from '@jest/globals'
import { getEvaluatedFormElement } from '@publicodes/forms'

const model = {
  bilan: { somme: ['transport', 'alimentation'] },
  transport: { somme: ['voiture', 'train'] },
  'transport . voiture': { 'applicable si': 'présent', valeur: 'km * 0.2' },
  'transport . voiture . présent': { question: 'Voiture ?', 'par défaut': 'oui', ordre: 1 },
  'transport . voiture . km': {
    question: 'Km ?',
    'par défaut': 1000,
    ordre: 2,
    plancher: 100,
    avertissement: 'Peu',
  },
  'transport . train': { question: 'Train ?', 'par défaut': 500 },
  alimentation: { somme: ['repas'] },
  'alimentation . repas': {
    question: 'Repas',
    mosaique: { options: ['viande', 'légumes'] },
    valeur: 'viande + légumes',
  },
  'alimentation . repas . viande': { question: 'Viande', 'par défaut': 3 },
  'alimentation . repas . légumes': { question: 'Légumes', 'par défaut': 4 },
  actions: { somme: ['action a', 'action b'] },
  'action a': { valeur: 10 },
  'action b': { valeur: 20 },
}

const viande = 'alimentation . repas . viande'
const legumes = 'alimentation . repas . légumes'

describe('mip-rules', () => {
  it('extracts rules metadata', () => {
    const meta = getRulesMeta(createMipEngine(model))

    expect(meta.categories).toEqual(['transport', 'alimentation'])
    expect(meta.subcategories).toEqual(['transport . voiture', 'transport . train', 'alimentation . repas'])
    expect(meta.mosaicChildrenWithParent).toEqual({ 'alimentation . repas': [viande, legumes] })
  })

  it('orders remaining questions by category, ordre and subcategory, grouping mosaics', () => {
    const engine = createMipEngine(model)
    const { remainingQuestions, relevantQuestions } = getFormQuestions(engine, getRulesMeta(engine), [])

    const expected = [
      'transport . voiture . présent',
      'transport . voiture . km',
      'transport . train',
      'alimentation . repas',
    ]
    expect(remainingQuestions).toEqual(expected)
    expect(relevantQuestions).toEqual(expected)
  })

  it('drops questions that are no longer applicable but keeps the unconditional answered one', () => {
    const engine = createMipEngine(model)
    const meta = getRulesMeta(engine)
    engine.setSituation({ 'transport . voiture . présent': 'non' })

    const { remainingQuestions, relevantQuestions } = getFormQuestions(engine, meta, ['transport . voiture . présent'])

    expect(remainingQuestions).toEqual(['transport . train', 'alimentation . repas'])
    expect(relevantQuestions).toEqual(['transport . voiture . présent', 'transport . train', 'alimentation . repas'])
  })

  it('resets unanswered mosaic siblings', () => {
    const engine = createMipEngine(model)
    expect(getMosaicResetSituation(engine, [viande, legumes], { [viande]: 2 })).toEqual({ [legumes]: 0 })
  })

  it('tracks a completed mosaic by its parent rule', () => {
    const engine = createMipEngine(model)
    const meta = getRulesMeta(engine)
    engine.setSituation({ [viande]: 2, [legumes]: 0 })

    const questions = getFormQuestions(engine, meta, ['alimentation . repas'])

    expect(questions.relevantAnsweredQuestions).toContain('alimentation . repas')
    expect(questions.remainingQuestions).not.toContain('alimentation . repas')
  })

  it('keeps newly applicable follow-up questions after their mosaic parent', () => {
    const engine = createMipEngine({
      bilan: { somme: ['DT'] },
      DT: {
        somme: ['voiture'],
        question: 'Transport ?',
        mosaique: { type: 'selection', options: ['voiture . présent'] },
      },
      'DT . voiture': { somme: ['présent', 'km'] },
      'DT . voiture . présent': { question: 'Voiture ?', 'par défaut': 'non' },
      'DT . voiture . km': {
        question: 'Distance ?',
        'applicable si': 'DT . voiture . présent',
        'par défaut': 100,
      },
    })
    const meta = getRulesMeta(engine)
    engine.setSituation({ 'DT . voiture . présent': 'oui' })

    const { relevantQuestions } = getFormQuestions(engine, meta, ['DT'])

    expect(relevantQuestions.indexOf('DT')).toBeLessThan(relevantQuestions.indexOf('DT . voiture . km'))
  })

  it('applies explicit ordre before mosaic-parent precedence', () => {
    const engine = createMipEngine({
      bilan: { somme: ['DT'] },
      DT: {
        question: 'Transport ?',
        ordre: 3,
        mosaique: { type: 'selection', options: ['voiture . présent'] },
      },
      'DT . voiture . présent': { question: 'Voiture ?', ordre: 2 },
    })

    expect(sortQuestions(engine, ['DT', 'DT . voiture . présent'], getRulesMeta(engine), {})).toEqual([
      'DT . voiture . présent',
      'DT',
    ])
  })

  it('advances from a folded mosaic to its newly applicable questions', () => {
    expect(getNextQuestion('DT', ['DT', 'DT . voiture . km', 'DT . voiture . utilisateur', 'transport'])).toBe(
      'DT . voiture . km',
    )
  })

  it('advances to the adjacent question after returning, even if it was already answered', () => {
    expect(getNextQuestion('DT', ['DT', 'DT . deux roues . km', 'DT . voiture . voyageurs'])).toBe(
      'DT . deux roues . km',
    )
  })

  it('persists evaluated defaults for questions when moving on', () => {
    const engine = createMipEngine(model)

    expect(getSituationWithQuestionDefaults(engine, 'transport . voiture . présent', {}, {})).toEqual({
      'transport . voiture . présent': 'oui',
    })
  })

  it('persists defaults for every child when moving on from an unanswered mosaic', () => {
    const engine = createMipEngine(model)
    const meta = getRulesMeta(engine)

    expect(getSituationWithQuestionDefaults(engine, 'alimentation . repas', {}, meta.mosaicChildrenWithParent)).toEqual(
      {
        [viande]: 3,
        [legumes]: 4,
      },
    )
  })

  it('groups newly applicable mode questions after the active mosaic without replacing other questions', () => {
    const previousOrder = ['DT . filtrage', 'DT . congé', 'DT . TT', 'DT', 'transport', 'alimentation']
    const availableQuestions = [
      ...previousOrder,
      'DT . voiture . km',
      'DT . voiture . utilisateur',
      'DT . voiture . voyageurs',
      'DT . deux roues . km',
      'DT . deux roues . type',
    ]

    expect(
      getStableQuestionOrder(
        previousOrder,
        'DT',
        availableQuestions,
        [
          'DT . voiture . km',
          'DT . deux roues . km',
          'DT . filtrage',
          'DT . voiture . utilisateur',
          'DT . deux roues . type',
          'DT . congé',
          'DT . TT',
          'DT . voiture . voyageurs',
          'DT',
          'transport',
          'alimentation',
        ],
        {
          DT: ['DT . voiture . présent', 'DT . deux roues . présent'],
        },
      ),
    ).toEqual([
      'DT . filtrage',
      'DT . congé',
      'DT . TT',
      'DT',
      'DT . voiture . km',
      'DT . voiture . utilisateur',
      'DT . voiture . voyageurs',
      'DT . deux roues . km',
      'DT . deux roues . type',
      'transport',
      'alimentation',
    ])
  })

  it('keeps mosaic choices visible when their calculation branches are inapplicable', () => {
    const engine = createMipEngine({
      bilan: { somme: ['DT'] },
      DT: {
        question: 'Transport ?',
        mosaique: { type: 'selection', options: ['train . présent'] },
      },
      'DT . train': { 'applicable si': 'DT . train . présent' },
      'DT . train . présent': { question: 'Train ?', 'par défaut': 'non' },
    })
    const children = getRulesMeta(engine).mosaicChildrenWithParent

    expect(getEvaluatedFormElement(engine, 'DT . train . présent').applicable).toBe(false)
    expect(buildGroupedElements(engine, 'DT', children)).toMatchObject([
      { type: 'mosaic', elements: [{ id: 'DT . train . présent' }] },
    ])
  })

  it('returns the plancher warning when the value is below it', () => {
    const engine = createMipEngine(model)
    engine.setSituation({ 'transport . voiture . km': 50 })
    expect(getPlancherWarning(engine, 'transport . voiture . km')).toBe('Peu')
    engine.setSituation({ 'transport . voiture . km': 200 })
    expect(getPlancherWarning(engine, 'transport . voiture . km')).toBeNull()
  })

  it('detects boolean, choice and numeric questions', () => {
    const engine = createMipEngine(model)
    const choicesEngine = createMipEngine({
      bilan: { somme: ['transport'] },
      transport: { somme: ['mode'] },
      'transport . mode': {
        question: 'Mode ?',
        'une possibilité': ['voiture', 'train'],
      },
      'transport . mode . voiture': null,
      'transport . mode . train': null,
    })

    expect(getQuestionType(engine, 'transport . voiture . présent')).toBe(MipQuestionType.Boolean)
    expect(getQuestionType(engine, 'transport . voiture . km')).toBe(MipQuestionType.Number)
    expect(getQuestionType(choicesEngine, 'transport . mode')).toBe(MipQuestionType.Choices)
  })

  it('sorts actions by value', () => {
    expect(getActions(createMipEngine(model))).toEqual(['action b', 'action a'])
  })

  it('reads somme from formule and variations', () => {
    expect(getSomme({ formule: { somme: ['a'] } })).toEqual(['a'])
    expect(getSomme({ variations: [{ alors: { somme: ['b'] } }] })).toEqual(['b'])
  })
})
