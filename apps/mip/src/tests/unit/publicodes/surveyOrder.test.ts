import { getRuleSum, sortFieldsByModelOrder } from '@/publicodes/mip-survey-order'
import { describe, expect, it } from '@jest/globals'
import Engine from 'publicodes'

const createMockEngine = (
  rules: Record<string, { rawNode: Record<string, unknown> }>,
  missingVariables: Record<string, number> = {},
) => {
  return {
    getParsedRules: () => rules,
    evaluate: () => ({ missingVariables }),
  } as unknown as Engine
}

describe('sortFieldsByModelOrder', () => {
  it('uses the root model sum for category order', () => {
    const engine = createMockEngine({
      bilan: { rawNode: { somme: ['alimentation', 'DT'] } },
      alimentation: { rawNode: { somme: ['repas'] } },
      'alimentation . repas': { rawNode: { question: 'Repas' } },
      DT: { rawNode: { somme: ['train'] } },
      'DT . train': { rawNode: { question: 'Train' } },
    })

    expect(sortFieldsByModelOrder(engine, ['DT . train', 'alimentation . repas'])).toEqual([
      'alimentation . repas',
      'DT . train',
    ])
  })

  it('uses dotted-name lexical order inside a category when ordre is absent', () => {
    const engine = createMockEngine({
      bilan: { rawNode: { somme: ['DT'] } },
      DT: { rawNode: { somme: ['train', 'deux roues', 'transports commun'] } },
      'DT . deux roues . type': { rawNode: { question: 'Deux roues type' } },
      'DT . TT': { rawNode: { question: 'Télétravail' } },
      'DT . train . présent': { rawNode: { question: 'Train' } },
      'DT . transports commun . type': { rawNode: { question: 'Transports commun type' } },
    })

    expect(
      sortFieldsByModelOrder(engine, [
        'DT . transports commun . type',
        'DT . train . présent',
        'DT . TT',
        'DT . deux roues . type',
      ]),
    ).toEqual([
      'DT . deux roues . type',
      'DT . train . présent',
      'DT . transports commun . type',
      'DT . TT',
    ])
  })

  it('keeps the MIP entity filter first when it is part of the fields', () => {
    const engine = createMockEngine({
      bilan: { rawNode: { somme: ['DT'] } },
      DT: { rawNode: { somme: ['train'] } },
      'DT . filtrage': { rawNode: { question: 'Service' } },
      'DT . congé': { rawNode: { question: 'Congé' } },
    })

    expect(sortFieldsByModelOrder(engine, ['DT . congé', 'DT . filtrage'])).toEqual(['DT . filtrage', 'DT . congé'])
  })

  it('uses ordinary ordre before dotted-name lexical fallback inside a category', () => {
    const engine = createMockEngine({
      bilan: { rawNode: { somme: ['DT'] } },
      DT: { rawNode: { somme: ['train', 'voiture'] } },
      'DT . train': { rawNode: { question: 'Train' } },
      'DT . train . heure': { rawNode: { question: 'Train time' } },
      'DT . voiture': { rawNode: { question: 'Voiture' } },
      'DT . voiture . km': { rawNode: { question: 'Distance', ordre: 2 } },
      'DT . voiture . utilisateur': { rawNode: { question: 'Utilisateur', ordre: 1 } },
    })

    expect(
      sortFieldsByModelOrder(engine, ['DT . voiture . km', 'DT . train . heure', 'DT . voiture . utilisateur']),
    ).toEqual(['DT . voiture . utilisateur', 'DT . voiture . km', 'DT . train . heure'])
  })

  it('uses the original field order only when names are equal after ordering', () => {
    const engine = createMockEngine({
      bilan: { rawNode: { somme: ['DT'] } },
      DT: { rawNode: { somme: ['train'] } },
      'DT . train . heure': { rawNode: { question: 'Train time' } },
      'DT . train . abonnement': { rawNode: { question: 'Train subscription' } },
    })

    expect(sortFieldsByModelOrder(engine, ['DT . train . abonnement', 'DT . train . heure'])).toEqual([
      'DT . train . abonnement',
      'DT . train . heure',
    ])
  })
})

describe('getRuleSum', () => {
  it('reads sums from optimized model shapes', () => {
    expect(getRuleSum({ somme: ['DT', 'transport'] })).toEqual(['DT', 'transport'])
    expect(getRuleSum({ formule: { somme: ['train', 'voiture'] } })).toEqual(['train', 'voiture'])
    expect(getRuleSum({ variations: [{ alors: { somme: ['bus', 'tram'] } }] })).toEqual(['bus', 'tram'])
  })
})
