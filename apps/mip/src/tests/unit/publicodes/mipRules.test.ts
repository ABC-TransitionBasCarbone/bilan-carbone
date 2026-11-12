import { buildGroupedElements } from '@/components/survey/surveyGrouping'
import { createMipEngine, createMipEngineWithoutDefaults } from '@/lib/publicodes/mip-engine'
import {
  getActions,
  getFormQuestions,
  getMosaicResetSituation,
  getNextQuestion,
  getPlancherWarning,
  getQuestionType,
  getRulesMeta,
  getSomme,
  getStableQuestionOrder,
  MipQuestionType,
  sortQuestions,
} from '@/lib/publicodes/mip-rules'
import { describe, expect, it } from '@jest/globals'
import { getEvaluatedFormElement } from '@publicodes/forms'
import seedModel from '../../../../prisma/seed/co2-model.FR-lang.fr-opti.json'

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
  it('does not apply model defaults when evaluating submitted situations', () => {
    const engine = createMipEngineWithoutDefaults(model)

    engine.setSituation({})
    expect(engine.evaluate('transport . voiture . km').nodeValue).not.toBe(1000)

    engine.setSituation({ 'transport . voiture . présent': 'oui', 'transport . voiture . km': 250 })
    expect(engine.evaluate('transport . voiture . km').nodeValue).toBe(250)
  })

  it('evaluates presence questions used by their parent applicability without defaults', () => {
    const engine = createMipEngineWithoutDefaults({
      bilan: { somme: ['DT'] },
      DT: { somme: ['train'] },
      'DT . train': { 'applicable si': 'DT . train . présent', valeur: 'km * 0.1' },
      'DT . train . présent': { question: 'Train ?', 'par défaut': 'non' },
      'DT . train . km': { question: 'Distance ?', 'par défaut': 100 },
    })

    engine.setSituation({ 'DT . train . présent': 'oui', 'DT . train . km': 50 })
    expect(engine.evaluate('bilan').nodeValue).toBe(5)
  })

  it('evaluates seed model totals and submitted food and digital answers without recursion', () => {
    const engine = createMipEngineWithoutDefaults(seedModel)
    const emptyFood = engine.evaluate('alimentation').nodeValue
    const emptyDigital = engine.evaluate('numérique').nodeValue

    expect(typeof engine.evaluate('bilan').nodeValue).toBe('number')
    expect(typeof emptyFood).toBe('number')
    expect(emptyDigital).toBe(0)

    engine.setSituation({
      'alimentation . plats . végétarien . nombre': 5,
      'numérique . internet . durée journalière': 2,
    })

    expect(engine.evaluate('alimentation').nodeValue).toBeGreaterThan(emptyFood as number)
    expect(engine.evaluate('numérique').nodeValue).toBeGreaterThan(0)
    expect(typeof engine.evaluate('bilan').nodeValue).toBe('number')
  })

  it('starts the model survey with domicile-work questions and keeps categories contiguous', () => {
    const engine = createMipEngine(seedModel)
    const meta = getRulesMeta(engine)
    const questions = getFormQuestions(engine, meta, []).relevantQuestions
    const categories = questions.map((question) => question.split(' . ')[0])

    expect(questions[0]).toBe('DT . filtrage')
    expect([...new Set(categories)]).toEqual(['DT', 'transport', 'alimentation', 'numérique', 'bureaux'])
    expect(categories).toEqual([...categories].sort((a, b) => meta.categories.indexOf(a) - meta.categories.indexOf(b)))
  })

  it('repairs persisted category order without losing answers or changing order within categories', () => {
    const sortedQuestions = ['DT . filtrage', 'DT . congé', 'DT', 'transport', 'alimentation', 'bureaux']
    const previousOrder = ['transport', 'alimentation', 'bureaux', 'DT . congé', 'DT . filtrage', 'DT']
    expect(getStableQuestionOrder(previousOrder, null, sortedQuestions, sortedQuestions)).toEqual([
      'DT . congé',
      'DT . filtrage',
      'DT',
      'transport',
      'alimentation',
      'bureaux',
    ])
  })

  it('keeps new questions in their category instead of inserting them after another category', () => {
    const sortedQuestions = ['DT . filtrage', 'DT', 'transport', 'transport . voiture . km', 'bureaux']
    expect(
      getStableQuestionOrder(['DT . filtrage', 'DT', 'transport', 'bureaux'], 'DT', sortedQuestions, sortedQuestions, {
        transport: ['transport . voiture . présent'],
      }),
    ).toEqual(sortedQuestions)
  })

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

  it('keeps an answered question in navigation order until navigating away', () => {
    const engine = createMipEngine(model)
    const meta = getRulesMeta(engine)
    engine.setSituation({ 'transport . voiture . présent': 'non', [viande]: 2, [legumes]: 0 })

    const questions = getFormQuestions(engine, meta, [])

    expect(questions.remainingQuestions).toEqual(['transport . train'])
    expect(questions.relevantQuestions).toEqual([
      'transport . voiture . présent',
      'transport . train',
      'alimentation . repas',
    ])
    expect(questions.relevantAnsweredQuestions).toEqual(['transport . voiture . présent', 'alimentation . repas'])
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

  it('orders DT car questions by the model ordre metadata', () => {
    const questions = [
      'DT . voiture . km',
      'DT . voiture . utilisateur',
      'DT . voiture . gabarit',
      'DT . voiture . motorisation',
      'DT . voiture . thermique . consommation aux 100',
    ]
    const engine = createMipEngine({
      bilan: { somme: ['DT'] },
      DT: { somme: ['voiture'] },
      'DT . voiture': { somme: ['km', 'utilisateur', 'gabarit', 'motorisation', 'thermique'] },
      'DT . voiture . km': { question: 'Distance ?', ordre: 1 },
      'DT . voiture . utilisateur': { question: 'Même voiture ?', ordre: 2 },
      'DT . voiture . gabarit': { question: 'Gabarit ?', ordre: 3 },
      'DT . voiture . motorisation': { question: 'Motorisation ?', ordre: 4 },
      'DT . voiture . thermique': { somme: ['consommation aux 100'] },
      'DT . voiture . thermique . consommation aux 100': { question: 'Consommation ?', ordre: 5 },
    })
    const meta = getRulesMeta(engine)

    expect(sortQuestions(engine, questions, meta, {})).toEqual(questions)
  })

  it.each(['DT . voiture', 'transport . voiture'])('orders %s consumption after motorization prerequisites', (car) => {
    const engine = createMipEngine(seedModel)
    const meta = getRulesMeta(engine)
    const questions = [
      `${car} . km`,
      `${car} . thermique . consommation aux 100`,
      `${car} . gabarit`,
      `${car} . motorisation`,
    ]

    expect(sortQuestions(engine, questions, meta, {})).toEqual([
      `${car} . km`,
      `${car} . gabarit`,
      `${car} . motorisation`,
      `${car} . thermique . consommation aux 100`,
    ])
  })

  it('lets model metadata override the usual car question sequence', () => {
    const engine = createMipEngine({
      bilan: { somme: ['transport'] },
      transport: { somme: ['voiture'] },
      'transport . voiture': { somme: ['km', 'motorisation', 'thermique . consommation aux 100'] },
      'transport . voiture . km': { question: 'Distance ?', ordre: 3 },
      'transport . voiture . motorisation': { question: 'Motorisation ?', ordre: 1 },
      'transport . voiture . thermique . consommation aux 100': { question: 'Consommation ?', ordre: 2 },
    })
    const questions = [
      'transport . voiture . km',
      'transport . voiture . thermique . consommation aux 100',
      'transport . voiture . motorisation',
    ]

    expect(sortQuestions(engine, questions, getRulesMeta(engine), {})).toEqual([
      'transport . voiture . motorisation',
      'transport . voiture . thermique . consommation aux 100',
      'transport . voiture . km',
    ])
  })

  describe.each(['DT . voiture', 'transport . voiture'])('%s motorization visibility', (car) => {
    it.each(['thermique', 'hybride', 'électrique'])(
      'shows only the %s follow-ups, including saved answers',
      (motor) => {
        const engine = createMipEngine(seedModel)
        const meta = getRulesMeta(engine)
        const fuel = `${car} . thermique . carburant`
        const thermal = `${car} . thermique . consommation aux 100`
        const electric = `${car} . électrique . consommation aux 100`
        const followUps = [fuel, thermal, electric]
        const situation = {
          'DT . voiture . présent': 'oui',
          'DT . voiture . utilisateur': "'propriétaire'",
          'DT . voiture . km': 20,
          'transport . voiture . présent': 'oui',
          'transport . voiture . km': 200,
          'transport . voiture . meme voiture': 'non',
          'transport . voiture . utilisateur': "'propriétaire'",
          [`${car} . motorisation`]: `'${motor}'`,
        }
        const expected = motor === 'électrique' ? [electric] : [thermal, fuel]
        engine.setSituation(situation)

        expect(
          getFormQuestions(engine, meta, []).remainingQuestions.filter((question) => followUps.includes(question)),
        ).toEqual(expected)

        engine.setSituation({ ...situation, [fuel]: "'essence E5 ou E10'", [thermal]: 7, [electric]: 20 })

        expect(
          getFormQuestions(engine, meta, followUps).relevantQuestions.filter((question) =>
            followUps.includes(question),
          ),
        ).toEqual(expected)
      },
    )
  })

  it('does not show the bus follow-up when only metro is selected', () => {
    const engine = createMipEngine(seedModel)
    const meta = getRulesMeta(engine)
    engine.setSituation({
      'transport . transports commun . présent': 'oui',
      'transport . transports commun . type . bus . présent': 'non',
      'transport . transports commun . type . métro ou tram . présent': 'oui',
    })

    const { remainingQuestions } = getFormQuestions(engine, meta, [])

    expect(remainingQuestions).not.toContain('transport . transports commun . type . bus . heures')
    expect(remainingQuestions).toContain('transport . transports commun . type . métro ou tram . heures')
  })

  it('orders the active DT car flow before consumption', () => {
    const engine = createMipEngine(seedModel)
    const meta = getRulesMeta(engine)
    engine.setSituation({
      'DT . voiture . présent': 'oui',
      'DT . voiture . utilisateur': "'propriétaire'",
    })

    const { remainingQuestions } = getFormQuestions(engine, meta, ['DT . voiture . km'])
    expect(remainingQuestions.indexOf('DT . voiture . motorisation')).toBeLessThan(
      remainingQuestions.indexOf('DT . voiture . thermique . consommation aux 100'),
    )
  })

  it('orders the professional car flow after choosing a different car', () => {
    const engine = createMipEngine(seedModel)
    const meta = getRulesMeta(engine)
    engine.setSituation({
      'DT . voiture . présent': 'oui',
      'DT . voiture . utilisateur': "'propriétaire'",
      'transport . voiture . présent': 'oui',
      'transport . voiture . meme voiture': 'non',
    })
    const expected = [
      'transport . voiture . gabarit',
      'transport . voiture . motorisation',
      'transport . voiture . thermique . consommation aux 100',
      'transport . voiture . thermique . carburant',
    ]
    const questions = getFormQuestions(engine, meta, ['DT . voiture . km', 'transport . voiture . km'])
    expect(questions.remainingQuestions.filter((question) => expected.includes(question))).toEqual(expected)
  })

  it.each(['DT . voiture', 'transport . voiture'])('restores %s electric consumption after motorization', (car) => {
    const engine = createMipEngine(seedModel)
    const meta = getRulesMeta(engine)
    engine.setSituation({
      'DT . voiture . présent': 'oui',
      'DT . voiture . utilisateur': "'propriétaire'",
      'transport . voiture . présent': 'oui',
      'transport . voiture . meme voiture': 'non',
      [`${car} . motorisation`]: "'électrique'",
    })
    const questions = getFormQuestions(engine, meta, ['DT . voiture . km', 'transport . voiture . km'])
    const sorted = questions.relevantQuestions
    const consumption = `${car} . électrique . consommation aux 100`
    const previousOrder = [consumption, ...sorted.filter((question) => question !== consumption)]
    const restored = getStableQuestionOrder(previousOrder, null, sorted, sorted, meta.mosaicChildrenWithParent)

    expect(sorted).toContain(consumption)
    expect(sorted.indexOf(`${car} . motorisation`)).toBeLessThan(sorted.indexOf(consumption))
    expect(restored.indexOf(`${car} . motorisation`)).toBeLessThan(restored.indexOf(consumption))
    expect(restored.indexOf(`${car} . gabarit`)).toBeLessThan(restored.indexOf(consumption))
  })

  it('preserves the office model single choice and its saved answer', () => {
    const ruleName = 'bureaux . énergie . question rhétorique'
    const engine = createMipEngine({
      bilan: { valeur: ruleName },
      bureaux: {},
      'bureaux . énergie': {},
      [ruleName]: { question: 'Information', 'par défaut': "'ok'", 'une possibilité': ['ok'] },
      [`${ruleName} . ok`]: { titre: 'OK' },
    }).setSituation({ [ruleName]: "'ok'" })

    expect(buildGroupedElements(engine, ruleName, {})).toMatchObject([
      {
        type: 'single',
        el: {
          value: 'ok',
          options: [{ label: 'OK', value: 'ok' }],
        },
      },
    ])
  })

  it('shows the office information question with a single OK answer', () => {
    const engine = createMipEngine(seedModel)
    const meta = getRulesMeta(engine)

    expect(getFormQuestions(engine, meta, []).remainingQuestions).toContain('bureaux . énergie . question rhétorique')
    expect(
      buildGroupedElements(engine, 'bureaux . énergie . question rhétorique', meta.mosaicChildrenWithParent),
    ).toMatchObject([
      {
        type: 'single',
        el: {
          options: [{ label: 'OK', value: 'ok' }],
        },
      },
    ])
    engine.setSituation({ 'bureaux . énergie . question rhétorique': "'ok'" })
    expect(
      buildGroupedElements(engine, 'bureaux . énergie . question rhétorique', meta.mosaicChildrenWithParent),
    ).toMatchObject([{ type: 'single', el: { value: 'ok' } }])
  })

  it('asks applicable single-choice confirmations without relying on office rule names', () => {
    const engine = createMipEngine({
      bilan: { valeur: 'transport' },
      transport: { valeur: 'confirmation' },
      'transport . confirmation': {
        question: 'Information',
        'par défaut': "'ok'",
        'une possibilité': ['ok'],
      },
      'transport . confirmation . ok': { titre: 'OK' },
      'transport . hidden': {
        question: 'Hidden information',
        'non applicable si': 'oui',
        'une possibilité': ['ok'],
      },
      'transport . hidden . ok': { titre: 'OK' },
    })
    const meta = getRulesMeta(engine)

    expect(getFormQuestions(engine, meta, []).remainingQuestions).toEqual(['transport . confirmation'])
    expect(getFormQuestions(engine, meta, ['transport . confirmation']).remainingQuestions).toEqual([])
    engine.setSituation({ 'transport . confirmation': "'ok'" })
    expect(getFormQuestions(engine, meta, ['transport . confirmation']).relevantQuestions).toEqual([
      'transport . confirmation',
    ])
  })

  it('shows the defaulted DT two-wheel passenger question with its label', () => {
    const engine = createMipEngine(seedModel)
    const meta = getRulesMeta(engine)
    engine.setSituation({ 'DT . deux roues . présent': 'oui' })

    expect(meta.everyQuestions).toContain('DT . deux roues . passagers')
    expect(getFormQuestions(engine, meta, []).remainingQuestions).toContain('DT . deux roues . passagers')
    expect(getQuestionType(engine, 'DT . deux roues . passagers')).toBe(MipQuestionType.Number)
    expect(buildGroupedElements(engine, 'DT . deux roues . passagers', meta.mosaicChildrenWithParent)).toMatchObject([
      {
        type: 'single',
        el: {
          label:
            'Combien de personnes voyagent avec vous en moyenne sur votre deux-roues lors de vos déplacements domicile-travail ?',
        },
      },
    ])
  })

  it('keeps the same-car question available after skipping the professional car distance', () => {
    const engine = createMipEngine(seedModel)
    const meta = getRulesMeta(engine)
    engine.setSituation({
      'DT . voiture . présent': 'oui',
      'DT . voiture . km': 20,
      'DT . voiture . utilisateur': "'propriétaire'",
      'transport . voiture . présent': 'oui',
    })

    const questions = getFormQuestions(engine, meta, ['transport . voiture . km'])

    expect(questions.remainingQuestions).toContain('transport . voiture . meme voiture')

    const availableQuestions = [...new Set([...questions.relevantQuestions, ...questions.remainingQuestions])]
    const questionOrder = getStableQuestionOrder(
      ['transport . voiture . km'],
      'transport . voiture . km',
      availableQuestions,
      sortQuestions(engine, availableQuestions, meta, questions.missingVariables),
      meta.mosaicChildrenWithParent,
    )

    expect(questionOrder).toContain('transport . voiture . meme voiture')
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

  it('keeps model defaults separate from unanswered numeric fields and mosaics', () => {
    const engine = createMipEngine(model)
    const meta = getRulesMeta(engine)

    expect(buildGroupedElements(engine, 'transport . voiture . km', meta.mosaicChildrenWithParent)).toMatchObject([
      { type: 'single', el: { value: undefined, defaultValue: 1000 } },
    ])
    expect(buildGroupedElements(engine, 'alimentation . repas', meta.mosaicChildrenWithParent)).toMatchObject([
      {
        type: 'mosaic',
        elements: [
          { value: undefined, defaultValue: 3 },
          { value: undefined, defaultValue: 4 },
        ],
      },
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
