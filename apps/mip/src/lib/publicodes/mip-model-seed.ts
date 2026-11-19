import mipModel from '../../../prisma/seed/co2-model.FR-lang.fr-opti.json'
import type { MipSimulationState } from '../../utils/survey'

export const mipSeedResponses: MipSimulationState[] = Array.from({ length: 15 }, (_, index) => {
  const n = index + 1
  return {
    situation: {
      'DT . voiture . présent': 'oui',
      'DT . voiture . km': ((n % 6) + 1) * 5,
      'transport . train . présent': n % 2 === 0 ? 'oui' : 'non',
      'alimentation . plats . végétarien . nombre': n % 5,
      'alimentation . plats . viande blanche . nombre': n % 4,
      'numérique . ia . nombre de requêtes par jour': n * 3,
      'numérique . visio . durée journalière': n % 7,
      'numérique . internet . durée journalière': n % 8,
    },
    foldedSteps: [],
    actionChoices: {},
    progression: 100,
    questionOrder: [],
  }
})

export default mipModel
