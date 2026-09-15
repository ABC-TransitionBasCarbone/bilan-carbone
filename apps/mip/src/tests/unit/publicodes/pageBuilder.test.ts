import { buildPageBuilder, getQuestionType, MipQuestionType, patchFormElement } from '@/publicodes/mip-form'
import { createMipEngine } from '@/publicodes/mip-engine'
import mipModel from '@/publicodes/mip-model'
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
  it('builds pages from the current MIP model', () => {
    const engine = createMipEngine(mipModel)

    const pages = buildPageBuilder(engine)([
      'DT . filtrage',
      'DT . voiture . présent',
      'DT . voiture . km',
      'DT . voiture . utilisateur',
    ])

    expect(pages.map((page) => page.elements[0])).toEqual([
      'DT . filtrage',
      'DT . voiture . présent',
      'DT . voiture . km',
      'DT . voiture . utilisateur',
    ])
  })

  it('does not inject rhetorical info questions from local text heuristics', () => {
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

    expect(pages.some((page) => page.elements.includes('bureaux . énergie . question rhétorique'))).toBe(false)
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

  it('respects raw rule order metadata when it is present', () => {
    const engine = createMockEngine({
      'DT . voiture . motorisation': { rawNode: { question: 'Motorisation', ordre: 5 } },
      'DT . voiture . gabarit': { rawNode: { question: 'Gabarit', ordre: 4 } },
      'DT . voiture . thermique . consommation aux 100': {
        rawNode: { question: 'Consommation', ordre: 3 },
      },
      'DT . voiture . thermique . carburant': { rawNode: { question: 'Carburant', ordre: 6 } },
      'DT . voiture . voyageurs': { rawNode: { question: 'Voyageurs', ordre: 7 } },
      'DT . voiture . utilisateur': { rawNode: { question: 'Utilisateur', ordre: 2 } },
      'DT . voiture . km': { rawNode: { question: 'Distance', ordre: 1 } },
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

  it('does not enforce electric-car fuel filtering in the form layer', () => {
    const engine = createMockEngine(
      {
        'DT . voiture . motorisation': { rawNode: { question: 'Motorisation' } },
        'DT . voiture . thermique . carburant': { rawNode: { question: 'Carburant' } },
      },
      { 'DT . voiture . motorisation': 'électrique' },
    )

    const pages = buildPageBuilder(engine)(['DT . voiture . motorisation', 'DT . voiture . thermique . carburant'])

    expect(pages.map((page) => page.elements[0])).toEqual([
      'DT . voiture . motorisation',
      'DT . voiture . thermique . carburant',
    ])
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

  it('does not synthesize rhetorical mosaic children from local heuristics', () => {
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
    expect(pagesWithUnrelatedAnswer).toEqual([])

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
