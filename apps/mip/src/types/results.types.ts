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
  unit: KeyStatUnit
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
