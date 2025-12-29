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
  /** List of posts for this environment */
  posts: SimplifiedPost[]
  /** Mapping of posts to their sub-posts */
  subPostsByPost: Record<SimplifiedPost, SubPost[]>
  /** Function to get the form layout for a sub-post */
  getFormLayout: (subPost: SubPost) => FormLayout<string>[]
  /** Function to get the Publicodes rule name for a post */
  getPostRuleName: (post: SimplifiedPost) => string
  /** Function to get the Publicodes rule name for a sub-post */
  getSubPostRuleName: (subPost: SubPost) => string | undefined
  /** The Publicodes engine for this environment */
  getEngine: () => Engine<string>
  /** The Publicodes Situation Provider component for this environment */
  SituationProvider: ComponentType<PublicodesSituationProviderProps>
  /** Hook to access the Publicodes situation context */
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

export function getSimplifiedPublicodesConfig(env: Environment): SimplifiedPublicodesConfig | undefined {
  return simplifiedPublicodesConfigMap[env]
}
