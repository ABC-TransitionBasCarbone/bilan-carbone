// TODO: Remove this file when plugged in with the real database.
// All types below (EmissionCategory, EntityFilter, SurveyComment, KeyStat, KeyStatGroup, SurveyResults)
// will be replaced by database models and API responses.

// Colors matching CSS variables from packages/css/style/colors.css
export const CATEGORY_COLORS: Record<string, string> = {
  total: '#346fef', // --primary-600
  commute: '#346fef', // --primary-500
  travel: '#272768', // --info
  food: '#1d9c5c', // --success-100
  digital: '#e04949', // --error-50
  office: '#fc8514', // --warning
}

export type EmissionCategory = {
  key: string
  labelFr: string
  value: number
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

export type KeyStatUnit = 'percent' | 'number' | 'km' | 'hours' | 'nights'

export type KeyStat = {
  key: string
  value: number
<<<<<<< HEAD
  unit: 'percent' | 'number' | 'km' | 'hours' | 'nights'
=======
  unit: KeyStatUnit
>>>>>>> 14a3cc555 (add key stat unit type and update translations for key stats)
}

export type KeyStatGroup = {
  key: string
  stats: KeyStat[]
}

export type SurveyResults = {
  surveyId: string
  totalRespondents: number
  averageFootprint: number
  categories: EmissionCategory[]
  entities: EntityFilter[]
  comments: SurveyComment[]
  keyStats: KeyStatGroup[]
}

// TODO: Remove sampleResults constant and getResultsForEntity function when plugged in with the real database.
export const sampleResults: SurveyResults = {
  surveyId: 'sample-survey-1',
  totalRespondents: 47,
  averageFootprint: 8400,
  categories: [
    { key: 'commute', labelFr: 'Déplacements domicile-travail', value: 2100, color: CATEGORY_COLORS.commute },
    { key: 'travel', labelFr: 'Déplacements professionnels', value: 1800, color: CATEGORY_COLORS.travel },
    { key: 'food', labelFr: 'Alimentation', value: 2500, color: CATEGORY_COLORS.food },
    { key: 'digital', labelFr: 'Numérique', value: 900, color: CATEGORY_COLORS.digital },
    { key: 'office', labelFr: 'Bureaux', value: 1100, color: CATEGORY_COLORS.office },
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
      key: 'commute',
      stats: [
        { key: 'carModeShare', value: 48, unit: 'percent' },
        { key: 'publicTransportModeShare', value: 33, unit: 'percent' },
        { key: 'activeModeShare', value: 19, unit: 'percent' },
        { key: 'avgCarKm', value: 26, unit: 'km' },
        { key: 'avgPublicTransportKm', value: 18, unit: 'km' },
        { key: 'avgEmissionPerMode', value: 0.8, unit: 'number' },
      ],
    },
    {
      key: 'travel',
      stats: [
        { key: 'trainModeShare', value: 39, unit: 'percent' },
        { key: 'carTravelModeShare', value: 21, unit: 'percent' },
        { key: 'planeTravelModeShare', value: 40, unit: 'percent' },
        { key: 'avgTravelKmByMode', value: 420, unit: 'km' },
        { key: 'avgTravelEmissionByMode', value: 0.7, unit: 'number' },
        { key: 'avgTravelNights', value: 2.1, unit: 'nights' },
      ],
    },
    {
      key: 'food',
      stats: [
        { key: 'vegMealsShare', value: 28, unit: 'percent' },
        { key: 'veganMealsShare', value: 7, unit: 'percent' },
        { key: 'fullyVegetarianEmployees', value: 9, unit: 'percent' },
        { key: 'fullyVeganEmployees', value: 4, unit: 'percent' },
        { key: 'redMeatDailyEmployees', value: 22, unit: 'percent' },
      ],
    },
    {
      key: 'digital',
      stats: [
        { key: 'aiRequestsPerDay', value: 11, unit: 'number' },
        { key: 'videoHoursPerDay', value: 1.4, unit: 'hours' },
        { key: 'internetHoursPerDay', value: 4.2, unit: 'hours' },
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
    averageFootprint: Math.round(results.averageFootprint * factor),
    categories: results.categories.map((c) => ({
      ...c,
      value: Math.round(c.value * factor),
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
