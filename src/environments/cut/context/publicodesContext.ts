'use client'

import { PUBLICODES_COUNT_VERSION } from '@/constants/versions'
import { createPublicodesContext } from '@/lib/publicodes/context/createPublicodesContext'
import { getCutEngine } from '../publicodes/cut-engine'
import { CutRuleName, CutSituation } from '../publicodes/types'

export const {
  PublicodesSituationProvider: CutPublicodesSituationProvider,
  usePublicodesSituation: useCutPublicodesSituation,
  PublicodesFormProvider: CutPublicodesFormProvider,
  usePublicodes: useCutPublicodes,
  usePublicodesAutoSave: useCutPublicodesAutoSave,
} = createPublicodesContext<CutRuleName, CutSituation>({
  getEngine: getCutEngine,
  modelVersion: PUBLICODES_COUNT_VERSION,
})
