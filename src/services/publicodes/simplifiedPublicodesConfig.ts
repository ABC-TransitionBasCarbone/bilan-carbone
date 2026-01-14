import { FormLayout } from '@/components/publicodes-form/layouts/formLayout'
import { CutPublicodesSituationProvider, useCutPublicodesSituation } from '@/environments/cut/context/publicodesContext'
import { getCutEngine } from '@/environments/cut/publicodes/cut-engine'
import {
  getPostRuleName as getCutPostRuleName,
  getSubPostRuleName as getCutSubPostRuleName,
  getFormLayoutsForSubPostCUT,
} from '@/environments/cut/publicodes/subPostMapping'
import { PublicodesSituationProviderProps } from '@/lib/publicodes/context/createPublicodesContext'
import { Environment, SubPost } from '@prisma/client'
import Engine from 'publicodes'
import { ComponentType } from 'react'
import { CutPost, SimplifiedPost, subPostsByPostCUT } from '../posts'

export interface SimplifiedPublicodesConfig {
  posts: SimplifiedPost[]
  subPostsByPost: Record<SimplifiedPost, SubPost[]>
  getFormLayout: (subPost: SubPost) => FormLayout<string>[]
  getPostRuleName: (post: SimplifiedPost) => string
  getSubPostRuleName: (subPost: SubPost) => string | undefined
  getEngine: () => Engine<string>
  SituationProvider: ComponentType<PublicodesSituationProviderProps>
  useSituation: () => {
    engine: Engine<string>
    situation: Record<string, unknown> | null
    isLoading: boolean
    error: string | null
  }
}

const cutConfig: SimplifiedPublicodesConfig = {
  posts: Object.values(CutPost),
  subPostsByPost: subPostsByPostCUT as Record<SimplifiedPost, SubPost[]>,
  getFormLayout: getFormLayoutsForSubPostCUT,
  getPostRuleName: getCutPostRuleName as (post: SimplifiedPost) => string,
  getSubPostRuleName: getCutSubPostRuleName,
  getEngine: getCutEngine,
  SituationProvider: CutPublicodesSituationProvider,
  useSituation: useCutPublicodesSituation,
}

const simplifiedPublicodesConfigMap: Partial<Record<Environment, SimplifiedPublicodesConfig>> = {
  [Environment.CUT]: cutConfig,
  // TODO: add Clickson config when available
  // [Environment.CLICKSON]: clicksonConfig,
}

export const getSimplifiedPublicodesConfig = (env: Environment): SimplifiedPublicodesConfig | undefined => {
  return simplifiedPublicodesConfigMap[env]
}
