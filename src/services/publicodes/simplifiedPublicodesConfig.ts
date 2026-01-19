import { FormLayout } from '@/components/publicodes-form/layouts/formLayout'
import { ClicksonSituationProvider, useClicksonSituation } from '@/environments/clickson/context/publicodesContext'
import { getClicksonEngine } from '@/environments/clickson/publicodes/clickson-engine'
import {
  getFormLayoutsForSubPostClickson,
  getPostRuleNameClickson,
  getSubPostRuleNameClickson,
} from '@/environments/clickson/publicodes/subPostMapping'
import { CutSituationProvider, useCutSituation } from '@/environments/cut/context/publicodesContext'
import { getCutEngine } from '@/environments/cut/publicodes/cut-engine'
import {
  getFormLayoutsForSubPostCUT,
  getPostRuleNameCut,
  getSubPostRuleNameCut,
} from '@/environments/cut/publicodes/subPostMapping'
import {
  PublicodesSituationContextValue,
  PublicodesSituationProviderProps,
} from '@/lib/publicodes/context/createPublicodesContext'
import { Environment, SubPost } from '@prisma/client'
import Engine, { Situation } from 'publicodes'
import { ComponentType } from 'react'
import { ClicksonPost, CutPost, SimplifiedPost, subPostsByPostClickson, subPostsByPostCUT } from '../posts'

export interface SimplifiedPublicodesConfig<
  RuleName extends string = string,
  S extends Situation<RuleName> = Situation<string>,
> {
  posts: SimplifiedPost[]
  subPostsByPost: Record<SimplifiedPost, SubPost[]>
  getFormLayout: (subPost: SubPost) => FormLayout<string>[]
  getPostRuleName: (post: SimplifiedPost) => string
  getSubPostRuleName: (subPost: SubPost) => string | undefined
  getEngine: () => Engine<string>
  SituationProvider: ComponentType<PublicodesSituationProviderProps>
  useSituation: () => PublicodesSituationContextValue<RuleName, S>
}

const cutConfig: SimplifiedPublicodesConfig = {
  posts: Object.values(CutPost),
  subPostsByPost: subPostsByPostCUT as Record<SimplifiedPost, SubPost[]>,
  getFormLayout: getFormLayoutsForSubPostCUT,
  getPostRuleName: getPostRuleNameCut as (post: SimplifiedPost) => string,
  getSubPostRuleName: getSubPostRuleNameCut,
  getEngine: getCutEngine,
  SituationProvider: CutSituationProvider,
  useSituation: useCutSituation,
}

const clicksonConfig: SimplifiedPublicodesConfig = {
  posts: Object.values(ClicksonPost),
  subPostsByPost: subPostsByPostClickson as Record<SimplifiedPost, SubPost[]>,
  // TODO:
  getFormLayout: getFormLayoutsForSubPostClickson,
  // TODO:
  getPostRuleName: getPostRuleNameClickson as (post: SimplifiedPost) => string,
  getSubPostRuleName: getSubPostRuleNameClickson,
  getEngine: getClicksonEngine,
  SituationProvider: ClicksonSituationProvider,
  useSituation: useClicksonSituation,
}

const SIMPLIFIED_PUBLICODES_CONFIGS: Partial<Record<Environment, SimplifiedPublicodesConfig>> = {
  [Environment.CUT]: cutConfig,
  [Environment.CLICKSON]: clicksonConfig,
}

export const getSimplifiedPublicodesConfig = (env: Environment): SimplifiedPublicodesConfig | undefined => {
  return SIMPLIFIED_PUBLICODES_CONFIGS[env]
}
