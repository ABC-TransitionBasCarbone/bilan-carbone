'use client'

import { PUBLICODES_CLICKSON_VERSION } from '@/constants/versions'
import { createPublicodesContext } from '@/lib/publicodes/context/createPublicodesContext'
import { getClicksonEngine } from '../publicodes/clickson-engine'
import { ClicksonRuleName, ClicksonSituation } from '../publicodes/types'

export const {
  PublicodesSituationProvider: ClicksonSituationProvider,
  usePublicodesSituation: useClicksonSituation,
  PublicodesFormProvider: ClicksonFormProvider,
  usePublicodes: useClicksonPublicodes,
  usePublicodesAutoSave: useClicksonAutoSave,
} = createPublicodesContext<ClicksonRuleName, ClicksonSituation>({
  getEngine: getClicksonEngine,
  modelVersion: PUBLICODES_CLICKSON_VERSION,
})
