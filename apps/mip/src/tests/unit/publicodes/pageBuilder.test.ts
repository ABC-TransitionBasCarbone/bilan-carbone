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
