import { EngagementActionSteps, EngagementActionTargets } from '@/constants/engagementActions'
import { EmissionSourcesStatus } from '@/services/study'
import { BCUnit } from '@/services/unit'
import {
  EmissionFactorBase,
  EmissionSourceCaracterisation,
  EmissionSourceType,
  EngagementPhase,
  SubPost,
} from '@prisma/client'

export type FeFilters = {
  archived: boolean
  search: string
  location: string
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
  steps: EngagementActionSteps[]
  targets: (EngagementActionTargets | string)[]
  phases: EngagementPhase[]
  dateRange: {
    startDate: string | null
    endDate: string | null
  }
}
