import { EngagementActionSteps, EngagementActionTargets } from '@/constants/engagementActions'
import { BCUnit } from '@/services/unit'
import {
  EmissionFactorBase,
  EmissionSourceCaracterisation,
  EmissionSourceType,
  EngagementPhase,
  SubPost,
} from '@abc-transitionbascarbone/db-common/enums'
import { EmissionSourcesStatus } from './emissionSource.types'

export type FeFilters = {
  archived: boolean
  search: string
  locations: string[]
  sources: string[]
  units: (BCUnit | string)[]
  subPosts: (SubPost | 'all')[]
  base?: EmissionFactorBase[]
}

export type EmissionSourcesFilters = {
  search: string
  subPosts: SubPost[]
  tags: string[]
  activityData: EmissionSourceType[]
  status: EmissionSourcesStatus[]
  caracterisations: EmissionSourceCaracterisation[]
}

export type EmissionSourcesSort = {
  field: 'activityData' | 'emissionFactor' | 'emissions' | 'uncertainty' | undefined
  order: 'asc' | 'desc'
}

export type EngagementActionsFilters = {
  search: string
  steps: (EngagementActionSteps | string)[]
  targets: (EngagementActionTargets | string)[]
  phases: EngagementPhase[]
  dateRange: {
    startDate: string | null
    endDate: string | null
  }
}
