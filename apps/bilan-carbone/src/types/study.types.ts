import { Export } from '@repo/db-common/enums'
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

export type ResultsByPost = Omit<BaseResultsByPost, 'children'> & {
  monetaryValue: number
  nonSpecificMonetaryValue: number
  numberOfEmissionSource: number
  numberOfValidatedEmissionSource: number
  squaredStandardDeviation: number
  children: ResultsByPost[]
}
