import { Export } from '@abc-transitionbascarbone/db-common/enums'
import { BaseResultsByPost } from '../services/posts'

export enum AdditionalResultTypes {
  CONSOLIDATED = 'consolidated',
  ENV_SPECIFIC_EXPORT = 'env_specific_export',
}

export type ResultType = Export | AdditionalResultTypes

export interface BaseResultsBySite {
  aggregated: BaseResultsByPost[]
  bySite: Record<string, BaseResultsByPost[]>
}

export interface StudySiteWithSite {
  id: string
  ca: number
  etp: number
  beneficiaryNumber: number | null
  volunteerNumber: number | null
  site: {
    id: string
    name: string
    postalCode?: string | null
    city?: string | null
    establishmentYear?: string | null
  }
}

export type ResultsByPost = Omit<BaseResultsByPost, 'children'> & {
  monetaryValue: number
  nonSpecificMonetaryValue: number
  numberOfEmissionSource: number
  numberOfValidatedEmissionSource: number
  squaredStandardDeviation: number
  children: ResultsByPost[]
}
