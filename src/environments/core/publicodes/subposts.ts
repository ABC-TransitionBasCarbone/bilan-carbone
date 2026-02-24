import { SUBPOST_TO_FORM_LAYOUTS as SUBPOST_TO_FORM_LAYOUTS_CLICKSON } from '@/environments/clickson/publicodes/subPostMapping'
import { SUBPOST_TO_FORM_LAYOUTS as SUBPOST_TO_FORM_LAYOUTS_CUT } from '@/environments/cut/publicodes/subPostMapping'
import { SUBPOST_TO_FORM_LAYOUTS as SUBPOST_TO_FORM_LAYOUTS_TILT } from '@/environments/tilt/publicodes/subPostMapping'
import { Environment, SubPost } from '@prisma/client'

export const SUBPOSTS_PUBLICODE_FROM_ENV: Partial<Record<Environment, SubPost[]>> = {
  [Environment.CLICKSON]: Object.keys(SUBPOST_TO_FORM_LAYOUTS_CLICKSON) as SubPost[],
  [Environment.CUT]: Object.keys(SUBPOST_TO_FORM_LAYOUTS_CUT) as SubPost[],
  [Environment.TILT]: Object.keys(SUBPOST_TO_FORM_LAYOUTS_TILT) as SubPost[],
}
