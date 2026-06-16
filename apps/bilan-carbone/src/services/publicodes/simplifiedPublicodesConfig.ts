import { PUBLICODES_CLICKSON_VERSION, PUBLICODES_COUNT_VERSION, PUBLICODES_TILT_VERSION } from '@/constants/versions'
import { getClicksonEngine } from '@/environments/clickson/publicodes/clickson-engine'
import {
  getFormLayoutsForSubPostClickson,
  getPostRuleNameClickson,
  getSubPostRuleNameClickson,
} from '@/environments/clickson/publicodes/subPostMapping'
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
import { EnvironmentWithSimplifiedStudies } from '@/services/permissions/environment'
import { Environment, SubPost } from '@abc-transitionbascarbone/db-common/enums'
import { FormLayout } from '@abc-transitionbascarbone/publicodes/form/layouts'
import Engine from 'publicodes'
import {
  ClicksonPost,
  CutPost,
  SimplifiedPost,
  subPostsByPostClickson,
  subPostsByPostCUT,
  subPostsByPostTILTSimplified,
  TiltSimplifiedPost,
} from '../posts'

export const TILT_SIMPLIFIED_POSTS_CONFIG_VERSION = 'tilt-simplified-posts-v1'

export interface SimplifiedPublicodesConfig {
  posts: SimplifiedPost[]
  subPostsByPost: Partial<Record<SimplifiedPost, SubPost[]>>
  getFormLayout: (subPost: SubPost) => FormLayout<string>[]
  getPostRuleName: (post: string) => string
  getSubPostRuleName: (subPost: SubPost) => string | undefined
  getEngine: () => Engine
  modelVersion: string
}

const TILT_SIMPLIFIED_POSTS_CONFIG: SimplifiedPublicodesConfig = {
  posts: Object.values(TiltSimplifiedPost),
  subPostsByPost: subPostsByPostTILTSimplified,
  getFormLayout: getFormLayoutsForSubPostTILT,
  getPostRuleName: (post) => getPostRuleNameTilt(post as TiltSimplifiedPost),
  getSubPostRuleName: getSubPostRuleNameTilt,
  getEngine: getTiltEngine,
  modelVersion: PUBLICODES_TILT_VERSION,
}

const CUT_CONFIG: SimplifiedPublicodesConfig = {
  posts: Object.values(CutPost),
  subPostsByPost: subPostsByPostCUT,
  getFormLayout: getFormLayoutsForSubPostCUT,
  getPostRuleName: (post) => getPostRuleNameCut(post as CutPost),
  getSubPostRuleName: getSubPostRuleNameCut,
  getEngine: getCutEngine,
  modelVersion: PUBLICODES_COUNT_VERSION,
}

const CLICKSON_CONFIG: SimplifiedPublicodesConfig = {
  posts: Object.values(ClicksonPost),
  subPostsByPost: subPostsByPostClickson,
  getFormLayout: getFormLayoutsForSubPostClickson,
  getPostRuleName: (post) => getPostRuleNameClickson(post as ClicksonPost),
  getSubPostRuleName: getSubPostRuleNameClickson,
  getEngine: getClicksonEngine,
  modelVersion: PUBLICODES_CLICKSON_VERSION,
}

const SIMPLIFIED_PUBLICODES_CONFIGS = {
  [Environment.CUT]: CUT_CONFIG,
  [Environment.CLICKSON]: CLICKSON_CONFIG,
  [Environment.TILT]: TILT_SIMPLIFIED_POSTS_CONFIG,
}

// subPostsConfigVersion parameter will be relevant when additional versions are added (e.g. tilt-simplified-posts-v2)
// For now it is only present to illustrate the logic
export const getSimplifiedPublicodesConfig = (
  env: EnvironmentWithSimplifiedStudies,
  subPostsConfigVersion: string | null | undefined,
) => {
  if (subPostsConfigVersion === TILT_SIMPLIFIED_POSTS_CONFIG_VERSION) {
    return TILT_SIMPLIFIED_POSTS_CONFIG
  }
  return SIMPLIFIED_PUBLICODES_CONFIGS[env]
}
