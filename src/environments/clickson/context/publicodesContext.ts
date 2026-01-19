'use client'

import { PUBLICODES_COUNT_VERSION } from '@/constants/versions'
import { createPublicodesContext } from '@/lib/publicodes/context/createPublicodesContext'
import { getClicksonEngine } from '../clickson-engine'
import { ClicksonRuleName, ClicksonSituation } from '../types'

export const {
  PublicodesSituationProvider: CutPublicodesSituationProvider,
  usePublicodesSituation: useCutPublicodesSituation,
  PublicodesFormProvider: CutPublicodesFormProvider,
  usePublicodes: useCutPublicodes,
  usePublicodesAutoSave: useCutPublicodesAutoSave,
} = createPublicodesContext<ClicksonRuleName, ClicksonSituation>({
  getEngine: getClicksonEngine,
  modelVersion: PUBLICODES_COUNT_VERSION,
})
