import { createMipEngine } from '@/publicodes/mip-engine'
import {
  buildPageBuilder,
  getQuestionType,
  MipQuestionType,
  patchFormElement,
  sortFieldsForPageBuilder,
} from '@/publicodes/mip-form'
import mipModel from '@/publicodes/mip-model-seed'
import { describe, expect, it } from '@jest/globals'
import Engine from 'publicodes'

const createMockEngine = (
  rules: Record<string, { rawNode: Record<string, unknown> }>,
  missingVariables: Record<string, number> = {},
  applicability: Record<string, boolean> = {},
  situation: Record<string, unknown> = {},
) => {
  return {
    getParsedRules: () => rules,
    getSituation: () => situation,
    evaluate: (rule: unknown) => {
      if (rule && typeof rule === 'object' && 'est applicable' in rule) {
        return { nodeValue: applicability[String(rule['est applicable'])] ?? 'mock' }
      }

      return { nodeValue: 'mock', missingVariables }
    },
  } as unknown as Engine
}

describe('buildPageBuilder', () => {
  it('keeps supplied fields that are applicable through their mosaic parent in the current MIP model', () => {
    const engine = createMipEngine(mipModel)

    const pages = buildPageBuilder(engine, [
      'DT . filtrage',
      'DT . voiture . présent',
      'DT . voiture . km',
      'DT . voiture . utilisateur',
    ])

    const pageElements = pages.map((page) => page.elements[0])

    expect(pageElements).toEqual(['DT . filtrage', 'DT . voiture . présent'])
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

    const pages = buildPageBuilder(engine, ['bureaux . déchets . tri'])

    expect(pages.some((page) => page.elements.includes('bureaux . énergie . question rhétorique'))).toBe(false)
  })

  it('does not build pages for explicitly non-applicable fields', () => {
    const engine = createMockEngine(
      {
        bilan: { rawNode: { somme: ['DT'] } },
        DT: { rawNode: { somme: ['filtrage', 'train'] } },
        'DT . filtrage': { rawNode: { question: 'Service' } },
        'DT . train . présent': { rawNode: { question: 'Train' } },
      },
      {},
      {
        'DT . train . présent': false,
      },
    )

    const pages = buildPageBuilder(engine, ['DT . filtrage', 'DT . train . présent'])

    expect(pages.map((page) => page.elements[0])).toEqual(['DT . filtrage'])
  })

  it('keeps mosaic child fields when their parent is applicable', () => {
    const engine = createMockEngine(
      {
        bilan: { rawNode: { somme: ['DT'] } },
        DT: {
          rawNode: {
            question: 'Transport choices',
            mosaique: {
              options: ['train . présent', 'voiture . présent'],
            },
            somme: ['train', 'voiture'],
          },
        },
        'DT . train . présent': { rawNode: { question: 'Train' } },
        'DT . voiture . présent': { rawNode: { question: 'Voiture' } },
      },
      {},
      {
        DT: true,
        'DT . train . présent': false,
        'DT . voiture . présent': false,
      },
    )

    const pages = buildPageBuilder(engine, ['DT . train . présent', 'DT . voiture . présent'])

    expect(pages).toEqual([
      {
        elements: ['DT . train . présent', 'DT . voiture . présent'],
        title: 'Transport choices',
      },
    ])
  })

  it('orders DT pages by the static reference order', () => {
    const engine = createMockEngine(
      {
        bilan: { rawNode: { somme: ['DT'] } },
        DT: {
          rawNode: {
            question: 'Transport choices',
            mosaique: {
              options: ['train . présent'],
            },
            somme: ['train'],
          },
        },
        'DT . filtrage': { rawNode: { question: 'Service' } },
        'DT . congé': { rawNode: { question: 'Congé' } },
        'DT . TT': { rawNode: { question: 'Télétravail' } },
        'DT . train . présent': { rawNode: { question: 'Train' } },
      },
      {},
      {
        DT: true,
      },
    )

    const pages = buildPageBuilder(engine, ['DT . train . présent', 'DT . TT', 'DT . filtrage', 'DT . congé'])

    expect(pages.map((page) => page.elements[0])).toEqual([
      'DT . filtrage',
      'DT . congé',
      'DT . train . présent',
      'DT . TT',
    ])
  })

  it('keeps the entity filter page first even when the engine returns it later', () => {
    const engine = createMockEngine({
      bilan: { rawNode: { somme: ['DT'] } },
      DT: { rawNode: { somme: ['train', 'voiture', 'filtrage'] } },
      'DT . voiture . présent': { rawNode: { question: 'Voiture' } },
      'DT . filtrage': { rawNode: { question: 'Service', ordre: -1000 } },
      'DT . train . présent': { rawNode: { question: 'Train' } },
    })

    const pages = buildPageBuilder(engine, ['DT . voiture . présent', 'DT . filtrage', 'DT . train . présent'])

    expect(pages.map((page) => page.elements[0])).toEqual([
      'DT . filtrage',
      'DT . train . présent',
      'DT . voiture . présent',
    ])
  })

  it('orders two-wheel details before public transport details when both are applicable', () => {
    const engine = createMockEngine({
      bilan: { rawNode: { somme: ['DT'] } },
      DT: { rawNode: { somme: ['deux roues', 'transports commun'] } },
      'DT . deux roues': { rawNode: { question: 'Deux roues' } },
      'DT . transports commun': { rawNode: { question: 'Transports commun' } },
      'DT . transports commun . type': {
        rawNode: {
          question: 'Transports commun',
          mosaique: {
            options: ['bus . présent'],
          },
        },
      },
      'DT . transports commun . type . bus . présent': { rawNode: { question: 'Bus' } },
      'DT . deux roues . type': { rawNode: { question: 'Deux roues' } },
    })

    const pages = buildPageBuilder(engine, ['DT . transports commun . type . bus . présent', 'DT . deux roues . type'])

    expect(pages.map((page) => page.elements[0])).toEqual([
      'DT . deux roues . type',
      'DT . transports commun . type . bus . présent',
    ])
  })

  it('keeps questions from the same category branch together', () => {
    const engine = createMockEngine({
      bilan: { rawNode: { somme: ['DT'] } },
      DT: { rawNode: { somme: ['train', 'voiture'] } },
      'DT . train . heure': { rawNode: { question: 'Train' } },
      'DT . voiture . voyageurs': { rawNode: { question: 'Voyageurs' } },
      'DT . train . vitesse': { rawNode: { question: 'Vitesse' } },
      'DT . voiture . carburant': { rawNode: { question: 'Carburant' } },
    })

    const pages = buildPageBuilder(engine, [
      'DT . train . heure',
      'DT . voiture . voyageurs',
      'DT . train . vitesse',
      'DT . voiture . carburant',
    ])

    expect(pages.map((page) => page.elements[0])).toEqual([
      'DT . train . heure',
      'DT . train . vitesse',
      'DT . voiture . carburant',
      'DT . voiture . voyageurs',
    ])
  })

  it('respects raw rule order metadata when it is present', () => {
    const engine = createMockEngine({
      bilan: { rawNode: { somme: ['DT'] } },
      DT: { rawNode: { somme: ['train', 'voiture'] } },
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

    const pages = buildPageBuilder(engine, [
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
      'DT . voiture . km',
      'DT . voiture . utilisateur',
      'DT . voiture . thermique . consommation aux 100',
      'DT . voiture . gabarit',
      'DT . voiture . motorisation',
      'DT . voiture . thermique . carburant',
      'DT . voiture . voyageurs',
      'DT . train . heure',
    ])
  })

  it('sorts accented category names according to the survey category order', () => {
    const engine = createMockEngine({
      bilan: { rawNode: { somme: ['numérique', 'bureaux'] } },
      'bureaux . énergie': { rawNode: { question: 'Énergie' } },
      'numérique . appareils': { rawNode: { question: 'Appareils' } },
    })

    const pages = buildPageBuilder(engine, ['bureaux . énergie', 'numérique . appareils'])

    expect(pages.map((page) => page.elements[0])).toEqual(['numérique . appareils', 'bureaux . énergie'])
  })

  it('normalizes category keys before using the survey order', () => {
    const engine = createMockEngine({
      bilan: { rawNode: { somme: ['numérique', 'bureaux'] } },
      'bureaux . énergie': { rawNode: { question: 'Énergie' } },
      'NUMÉRIQUE . appareils': { rawNode: { question: 'Appareils' } },
    })

    const pages = buildPageBuilder(engine, ['bureaux . énergie', 'NUMÉRIQUE . appareils'])

    expect(pages.map((page) => page.elements[0])).toEqual(['NUMÉRIQUE . appareils', 'bureaux . énergie'])
  })

  it('keeps field ordering stable through the shared ordering helper', () => {
    const engine = createMockEngine({
      bilan: { rawNode: { somme: ['transport', 'numérique', 'bureaux'] } },
      'bureaux . énergie': { rawNode: { question: 'Énergie' } },
      'numérique . appareils': { rawNode: { question: 'Appareils' } },
      'transport . voiture . km': { rawNode: { question: 'Distance' } },
      'transport . train . heure': { rawNode: { question: 'Heure' } },
    })

    expect(
      sortFieldsForPageBuilder(engine, ['bureaux . énergie', 'transport . voiture . km', 'numérique . appareils']),
    ).toEqual(['transport . voiture . km', 'numérique . appareils', 'bureaux . énergie'])
  })

  it('marks rules without a renderable question as non-renderable', () => {
    const engine = createMockEngine({
      'transport . voiture': {
        rawNode: {
          question: 'Voiture',
        },
      },
      'transport . filtre': {
        rawNode: {
          titre: 'Filtre',
        },
      },
    })

    expect(getQuestionType(engine, 'transport . filtre')).toBe(MipQuestionType.NoRenderableQuestion)
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
