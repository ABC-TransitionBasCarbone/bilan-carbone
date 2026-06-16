export type EmissionCategory = {
  key: string
  labelFr: string
  valueTCO2e: number
  color: string
}

export type EntityFilter = {
  id: string
  name: string
}

export type SurveyComment = {
  id: string
  category: string
  text: string
}

export type KeyStat = {
  key: string
  value: number
  unit: 'percent' | 'number'
}

export type KeyStatGroup = {
  key: string
  stats: KeyStat[]
}

export type SurveyResults = {
  surveyId: string
  totalRespondents: number
  totalInvited: number
  averageFootprintTCO2e: number
  categories: EmissionCategory[]
  entities: EntityFilter[]
  comments: SurveyComment[]
  keyStats: KeyStatGroup[]
}

export const sampleResults: SurveyResults = {
  surveyId: 'sample-survey-1',
  totalRespondents: 47,
  totalInvited: 120,
  averageFootprintTCO2e: 8.4,
  categories: [
    { key: 'commute', labelFr: 'Déplacements domicile-travail', valueTCO2e: 2.1, color: '#346fef' },
    { key: 'travel', labelFr: 'Déplacements professionnels', valueTCO2e: 1.8, color: '#272768' },
    { key: 'food', labelFr: 'Alimentation', valueTCO2e: 2.5, color: '#1d9c5c' },
    { key: 'digital', labelFr: 'Numérique', valueTCO2e: 0.9, color: '#e04949' },
    { key: 'office', labelFr: 'Bureaux', valueTCO2e: 1.1, color: '#f59e0b' },
  ],
  entities: [
    { id: 'all', name: 'Tous' },
    { id: 'rh', name: 'Ressources humaines' },
    { id: 'it', name: 'Informatique' },
    { id: 'commercial', name: 'Commercial' },
    { id: 'direction', name: 'Direction' },
  ],
  comments: [
    {
      id: '1',
      category: 'Déplacements domicile-travail',
      text: 'Je prends le train depuis Bordeaux chaque semaine, difficile de faire autrement.',
    },
    {
      id: '2',
      category: 'Alimentation',
      text: "La cantine propose peu de plats végétariens, ce serait bien d'en avoir plus.",
    },
    {
      id: '3',
      category: 'Numérique',
      text: "Mon ordinateur a plus de 5 ans, pas besoin de le remplacer tant qu'il fonctionne.",
    },
    {
      id: '4',
      category: 'Déplacements professionnels',
      text: "Beaucoup de réunions pourraient se faire en visio plutôt qu'en présentiel.",
    },
    {
      id: '5',
      category: 'Bureaux',
      text: 'Le chauffage est souvent trop fort en hiver, on ouvre les fenêtres.',
    },
  ],
  keyStats: [
    {
      key: 'transport',
      stats: [
        { key: 'plane', value: 12, unit: 'percent' },
        { key: 'longHaulPlane', value: 5, unit: 'percent' },
        { key: 'carKm', value: 18500, unit: 'number' },
        { key: 'carPassengers', value: 1.3, unit: 'number' },
      ],
    },
    {
      key: 'housing',
      stats: [
        { key: 'electricHeating', value: 34, unit: 'percent' },
        { key: 'gasHeating', value: 41, unit: 'percent' },
        { key: 'oilHeating', value: 8, unit: 'percent' },
        { key: 'woodHeating', value: 11, unit: 'percent' },
        { key: 'airConditioning', value: 27, unit: 'percent' },
      ],
    },
    {
      key: 'food',
      stats: [
        { key: 'vegan', value: 4, unit: 'percent' },
        { key: 'redMeatDaily', value: 22, unit: 'percent' },
        { key: 'localSeasonal', value: 36, unit: 'percent' },
        { key: 'bottledWater', value: 18, unit: 'percent' },
        { key: 'zeroWaste', value: 9, unit: 'percent' },
      ],
    },
    {
      key: 'misc',
      stats: [
        { key: 'newClothes', value: 14, unit: 'number' },
        { key: 'socialMediaOver3h', value: 28, unit: 'percent' },
      ],
    },
  ],
}

export function getResultsForEntity(results: SurveyResults, entityId: string): SurveyResults {
  if (entityId === 'all') {
    return results
  }
  const entityFactors: Record<string, number> = {
    rh: 0.85,
    it: 1.15,
    commercial: 1.3,
    direction: 0.95,
  }
  const factor = entityFactors[entityId] ?? 1
  return {
    ...results,
    averageFootprintTCO2e: Math.round(results.averageFootprintTCO2e * factor * 10) / 10,
    categories: results.categories.map((c) => ({
      ...c,
      valueTCO2e: Math.round(c.valueTCO2e * factor * 10) / 10,
    })),
    keyStats: results.keyStats.map((group) => ({
      ...group,
      stats: group.stats.map((s) => ({
        ...s,
        value: s.unit === 'percent' ? Math.min(100, Math.round(s.value * factor)) : Math.round(s.value * factor),
      })),
    })),
  }
}

