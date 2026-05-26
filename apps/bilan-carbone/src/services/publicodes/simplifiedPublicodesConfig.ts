import { FormLayout } from '@/components/publicodes-form/layouts/formLayout'
import { PUBLICODES_CLICKSON_VERSION, PUBLICODES_COUNT_VERSION, PUBLICODES_TILT_VERSION } from '@/constants/versions'
import { getClicksonEngine } from '@/environments/clickson/publicodes/clickson-engine'
import {
  getFormLayoutsForSubPostClickson,
  getPostRuleNameClickson,
  getSubPostRuleNameClickson,
} from '@/environments/clickson/publicodes/subPostMapping'
import { POSTS_PUBLICODE_FROM_ENV } from '@/environments/core/publicodes/subposts'
import { getCutEngine } from '@/environments/cut/publicodes/cut-engine'
import {
  getFormLayoutsForSubPostCUT,
  getPostRuleNameCut,
  getSubPostRuleNameCut,
} from '@/environments/cut/publicodes/subPostMapping'
import {
  getFormLayoutsForSubPostTILT,
  getPostRuleNameTilt,
  getSubPostRuleNameTilt,
} from '@/environments/tilt/publicodes/subPostMapping'
import { getTiltEngine } from '@/environments/tilt/publicodes/tilt-engine'
import { Environment, SubPost } from '@abc-transitionbascarbone/db-common/enums'
import Engine from 'publicodes'
import { getSubPostByPostTiltSimplified, SimplifiedPost, subPostsByPostClickson, subPostsByPostCUT } from '../posts'
import { ClicksonPost, CutPost } from '../posts.enums'

export type SimplifiedEnvironment = 'CUT' | 'CLICKSON' | 'TILT'

export const isSimplifiedEnvironment = (env: Environment): env is SimplifiedEnvironment => {
  return env === Environment.CUT || env === Environment.CLICKSON
}

export interface SimplifiedPublicodesConfig<RuleName extends string = string> {
  posts: SimplifiedPost[]
  subPostsByPost: Record<SimplifiedPost, SubPost[]>
  getFormLayout: (subPost: SubPost) => FormLayout<string>[]
  getPostRuleName: (post: SimplifiedPost) => RuleName
  getSubPostRuleName: (subPost: SubPost) => RuleName | undefined
  getEngine: () => Engine<RuleName>
  modelVersion: string
}

const SIMPLIFIED_PUBLICODES_CONFIGS = {
  [Environment.CUT]: {
    posts: Object.values(CutPost),
    subPostsByPost: subPostsByPostCUT as Record<SimplifiedPost, SubPost[]>,
    getFormLayout: getFormLayoutsForSubPostCUT,
    getPostRuleName: getPostRuleNameCut as (post: SimplifiedPost) => string,
    getSubPostRuleName: getSubPostRuleNameCut,
    getEngine: getCutEngine,
    modelVersion: PUBLICODES_COUNT_VERSION,
  } satisfies SimplifiedPublicodesConfig,
  [Environment.CLICKSON]: {
    posts: Object.values(ClicksonPost),
    subPostsByPost: subPostsByPostClickson as Record<SimplifiedPost, SubPost[]>,
    getFormLayout: getFormLayoutsForSubPostClickson,
    getPostRuleName: getPostRuleNameClickson as (post: SimplifiedPost) => string,
    getSubPostRuleName: getSubPostRuleNameClickson,
    getEngine: getClicksonEngine,
    modelVersion: PUBLICODES_CLICKSON_VERSION,
  } satisfies SimplifiedPublicodesConfig,
  [Environment.TILT]: {
    posts: POSTS_PUBLICODE_FROM_ENV[Environment.TILT] ?? [],
    subPostsByPost: getSubPostByPostTiltSimplified(),
    getFormLayout: getFormLayoutsForSubPostTILT,
    getPostRuleName: getPostRuleNameTilt as (post: SimplifiedPost) => string,
    getSubPostRuleName: getSubPostRuleNameTilt,
    getEngine: getTiltEngine,
    modelVersion: PUBLICODES_TILT_VERSION,
  } satisfies SimplifiedPublicodesConfig,
} satisfies Record<SimplifiedEnvironment, SimplifiedPublicodesConfig>

export const getSimplifiedPublicodesConfig = (env: SimplifiedEnvironment): SimplifiedPublicodesConfig => {
  return SIMPLIFIED_PUBLICODES_CONFIGS[env]
}
