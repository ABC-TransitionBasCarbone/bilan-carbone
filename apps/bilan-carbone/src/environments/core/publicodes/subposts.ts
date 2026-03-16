import {
  POST_TO_RULENAME as POST_TO_RULENAME_CLICKSON,
  SUBPOST_TO_FORM_LAYOUTS as SUBPOST_TO_FORM_LAYOUTS_CLICKSON,
} from '@/environments/clickson/publicodes/subPostMapping'
import {
  POST_TO_RULENAME as POST_TO_RULENAME_CUT,
  SUBPOST_TO_FORM_LAYOUTS as SUBPOST_TO_FORM_LAYOUTS_CUT,
} from '@/environments/cut/publicodes/subPostMapping'
import {
  POST_TO_RULENAME as POST_TO_RULENAME_TILT,
  SUBPOST_TO_FORM_LAYOUTS as SUBPOST_TO_FORM_LAYOUTS_TILT,
} from '@/environments/tilt/publicodes/subPostMapping'
import { SimplifiedPost } from '@/services/posts'
import { Environment, SubPost } from '@prisma/client'

export const SUBPOSTS_PUBLICODE_FROM_ENV: Partial<Record<Environment, SubPost[]>> = {
  [Environment.CLICKSON]: Object.keys(SUBPOST_TO_FORM_LAYOUTS_CLICKSON) as SubPost[],
  [Environment.CUT]: Object.keys(SUBPOST_TO_FORM_LAYOUTS_CUT) as SubPost[],
  [Environment.TILT]: Object.keys(SUBPOST_TO_FORM_LAYOUTS_TILT) as SubPost[],
}

export const POSTS_PUBLICODE_FROM_ENV: Partial<Record<Environment, SimplifiedPost[]>> = {
  [Environment.CLICKSON]: Object.keys(POST_TO_RULENAME_CLICKSON) as SimplifiedPost[],
  [Environment.CUT]: Object.keys(POST_TO_RULENAME_CUT) as SimplifiedPost[],
  [Environment.TILT]: Object.keys(POST_TO_RULENAME_TILT) as SimplifiedPost[],
}
