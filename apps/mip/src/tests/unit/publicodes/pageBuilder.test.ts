import { buildPageBuilder, getQuestionType, MipQuestionType, patchFormElement } from '@/publicodes/mip-form'
import { describe, expect, it } from '@jest/globals'
import Engine from 'publicodes'

const createMockEngine = (
  rules: Record<string, { rawNode: Record<string, unknown> }>,
  situation: Record<string, unknown> = {},
) => {
  return {
    getParsedRules: () => rules,
    getSituation: () => situation,
    evaluate: () => ({ nodeValue: 'mock' }),
  } as unknown as Engine
}

describe('buildPageBuilder', () => {
  it('preserves rhetorical info questions for the survey flow', () => {
    const engine = createMockEngine({
      bureaux: {
        rawNode: {
          question: 'Bureaux',
        },
      },
      'bureaux . déchets': {
        rawNode: {
          question: 'Déchets',
          mosaique: {
            options: ['tri'],
          },
        },
      },
      'bureaux . déchets . tri': {
        rawNode: {
          question: 'Tri des déchets',
        },
      },
      'bureaux . énergie': {
        rawNode: {
          question: 'Énergie',
          mosaique: {
            options: ['question rhétorique'],
          },
        },
      },
      'bureaux . énergie . question rhétorique': {
        rawNode: {
          question: 'question rhétorique',
        },
      },
    })

    const pages = buildPageBuilder(engine)(['bureaux . déchets . tri'])

    expect(pages.some((page) => page.elements.includes('bureaux . énergie . question rhétorique'))).toBe(true)
  })

  it('keeps questions from the same category branch together', () => {
    const engine = createMockEngine({
      'DT . train . heure': { rawNode: { question: 'Train' } },
      'DT . voiture . voyageurs': { rawNode: { question: 'Voyageurs' } },
      'DT . train . vitesse': { rawNode: { question: 'Vitesse' } },
      'DT . voiture . carburant': { rawNode: { question: 'Carburant' } },
    })

    const pages = buildPageBuilder(engine)([
      'DT . train . heure',
      'DT . voiture . voyageurs',
      'DT . train . vitesse',
      'DT . voiture . carburant',
    ])

    expect(pages.map((page) => page.elements[0])).toEqual([
      'DT . train . heure',
      'DT . train . vitesse',
      'DT . voiture . voyageurs',
      'DT . voiture . carburant',
    ])
  })

  it('uses the survey order for dependent car questions without model metadata', () => {
    const engine = createMockEngine({
      'DT . voiture . motorisation': { rawNode: { question: 'Motorisation' } },
      'DT . voiture . gabarit': { rawNode: { question: 'Gabarit' } },
      'DT . voiture . thermique . consommation aux 100': {
        rawNode: { question: 'Consommation' },
      },
      'DT . voiture . thermique . carburant': { rawNode: { question: 'Carburant' } },
      'DT . voiture . voyageurs': { rawNode: { question: 'Voyageurs' } },
      'DT . voiture . utilisateur': { rawNode: { question: 'Utilisateur' } },
      'DT . voiture . km': { rawNode: { question: 'Distance' } },
      'DT . train . heure': { rawNode: { question: 'Train' } },
    })

    const pages = buildPageBuilder(engine)([
      'DT . train . heure',
      'DT . voiture . motorisation',
      'DT . voiture . gabarit',
      'DT . voiture . thermique . consommation aux 100',
      'DT . voiture . thermique . carburant',
      'DT . voiture . voyageurs',
      'DT . voiture . utilisateur',
      'DT . voiture . km',
    ])

    expect(pages.map((page) => page.elements[0])).toEqual([
      'DT . train . heure',
      'DT . voiture . km',
      'DT . voiture . utilisateur',
      'DT . voiture . thermique . consommation aux 100',
      'DT . voiture . gabarit',
      'DT . voiture . motorisation',
      'DT . voiture . thermique . carburant',
      'DT . voiture . voyageurs',
    ])
  })

  it('removes the fuel question when the car is electric', () => {
    const engine = createMockEngine(
      {
        'DT . voiture . motorisation': { rawNode: { question: 'Motorisation' } },
        'DT . voiture . thermique . carburant': { rawNode: { question: 'Carburant' } },
      },
      { 'DT . voiture . motorisation': 'électrique' },
    )

    const pages = buildPageBuilder(engine)(['DT . voiture . motorisation', 'DT . voiture . thermique . carburant'])

    expect(pages.map((page) => page.elements[0])).toEqual(['DT . voiture . motorisation'])
  })

  it('sorts accented category names according to the survey category order', () => {
    const engine = createMockEngine({
      'bureaux . énergie': { rawNode: { question: 'Énergie' } },
      'numérique . appareils': { rawNode: { question: 'Appareils' } },
    })

    const pages = buildPageBuilder(engine)(['bureaux . énergie', 'numérique . appareils'])

    expect(pages.map((page) => page.elements[0])).toEqual(['numérique . appareils', 'bureaux . énergie'])
  })

  it('normalizes category keys before using the survey order', () => {
    const engine = createMockEngine({
      'bureaux . énergie': { rawNode: { question: 'Énergie' } },
      'NUMÉRIQUE . appareils': { rawNode: { question: 'Appareils' } },
    })

    const pages = buildPageBuilder(engine)(['bureaux . énergie', 'NUMÉRIQUE . appareils'])

    expect(pages.map((page) => page.elements[0])).toEqual(['NUMÉRIQUE . appareils', 'bureaux . énergie'])
  })

  it('keeps rhetorical mosaic children only when the real child is still unanswered', () => {
    const mismatchedSituationEngine = createMockEngine(
      {
        'bureaux . énergie': {
          rawNode: {
            question: 'Énergie',
            mosaique: {
              options: ['question rhétorique'],
            },
          },
        },
        'bureaux . énergie . question rhétorique': {
          rawNode: {
            question: 'question rhétorique',
          },
        },
      },
      { 'bureaux . énergie . autre': 'oui' },
    )

    const pagesWithUnrelatedAnswer = buildPageBuilder(mismatchedSituationEngine)([])
    expect(
      pagesWithUnrelatedAnswer.some((page) => page.elements.includes('bureaux . énergie . question rhétorique')),
    ).toBe(true)

    const answeredMosaicEngine = createMockEngine(
      {
        'bureaux . énergie': {
          rawNode: {
            question: 'Énergie',
            mosaique: {
              options: ['question rhétorique'],
            },
          },
        },
        'bureaux . énergie . question rhétorique': {
          rawNode: {
            question: 'question rhétorique',
          },
        },
      },
      { 'bureaux . énergie . question rhétorique': 'oui' },
    )

    const pagesWithRealAnswer = buildPageBuilder(answeredMosaicEngine)([])
    expect(pagesWithRealAnswer).toEqual([])
  })

  it('detects choice questions from the raw node and patches the input rendering', () => {
    const engine = createMockEngine({
      'transport . voiture': {
        rawNode: {
          question: 'Voiture',
          'une possibilité': {
            'voiture thermique': true,
          },
        },
      },
    })

    expect(getQuestionType(engine, 'transport . voiture')).toBe(MipQuestionType.Choices)
    expect(
      patchFormElement({ element: 'input', type: 'text', id: 'transport . voiture' } as never, MipQuestionType.Choices),
    ).toMatchObject({ element: 'select' })
    expect(
      patchFormElement(
        { element: 'input', type: 'checkbox', id: 'transport . voiture' } as never,
        MipQuestionType.Boolean,
      ),
    ).toMatchObject({
      element: 'RadioGroup',
      options: [
        { label: 'Oui', value: true },
        { label: 'Non', value: false },
      ],
    })
  })
})
