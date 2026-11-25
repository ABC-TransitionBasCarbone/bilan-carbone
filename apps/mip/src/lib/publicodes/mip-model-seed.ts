import mipModel from '../../../prisma/seed/co2-model.FR-lang.fr-opti.json'
import type { MipSimulationState } from '../../utils/survey'

export const mipSeedResponses: MipSimulationState[] = Array.from({ length: 15 }, (_, index) => {
  const n = index + 1
  const vegetarianMeals = n <= 3 ? 5 : n <= 12 ? 3 : 0
  const redMeatMeals = n <= 3 ? 0 : n <= 12 ? 1 : 2
  const videoHours = [0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 6, 7][index]
  const internetHours = [0, 1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 6, 7, 10][index]

  return {
    situation: {
      'DT . filtrage': Math.ceil(n / 3) === 5 ? 99 : Math.ceil(n / 3),
      'DT . voiture . présent': 'non',
      'DT . voiture . km': 0,
      'transport . train . présent': n % 2 === 0 ? 'oui' : 'non',
      'alimentation . plats . végétalien . nombre': 0,
      'alimentation . plats . végétarien . nombre': vegetarianMeals,
      'alimentation . plats . viande blanche . nombre': 5 - vegetarianMeals - redMeatMeals,
      'alimentation . plats . viande rouge . nombre': redMeatMeals,
      'numérique . ia . nombre de requêtes par jour': n * 3,
      'numérique . visio . durée journalière': videoHours,
      'numérique . internet . durée journalière': internetHours,
    },
    foldedSteps: [],
    actionChoices: {},
    progression: 100,
    questionOrder: [],
  }
})

export default mipModel
