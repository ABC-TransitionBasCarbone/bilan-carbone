import { FormLayout } from '@/components/publicodes-form/layouts/formLayout'
import { getFormLayoutsForSubPostCUT } from '@/environments/cut/publicodes/subPostMapping'
import { Environment, SubPost } from '@prisma/client'
import { CutPost, SimplifiedPost, subPostsByPostCUT } from '../posts'

export interface SimplifiedPublicodesConfig {
  posts: SimplifiedPost[]
  subPostsByPost: Record<SimplifiedPost, SubPost[]>
  getFormLayout: (subPost: SubPost) => FormLayout<string>[]
}

const simplifiedPublicodesConfig: Partial<Record<Environment, SimplifiedPublicodesConfig>> = {
  [Environment.CUT]: {
    posts: Object.values(CutPost),
    subPostsByPost: subPostsByPostCUT as Record<SimplifiedPost, SubPost[]>,
    getFormLayout: getFormLayoutsForSubPostCUT,
  },
  // TODO: add Clickson config when available
  // [Environment.CLICKSON]: { ... },
}

export function getSimplifiedPublicodesConfig(env: Environment): SimplifiedPublicodesConfig | undefined {
  return simplifiedPublicodesConfig[env]
}
