'use client'

import { useToast } from '@/components/base/ToastProvider'
import { createPublicodesFormContext } from '@/components/publicodes-form/PublicodesFormContext'
import { PUBLICODES_COUNT_VERSION } from '@/constants/versions'
import { FullStudy } from '@/db/study'
import { useBeforeUnload } from '@/hooks/useBeforeUnload'
import { usePublicodesForm } from '@/hooks/usePublicodesForm'
import { useTranslations } from 'next-intl'
import { ReactNode, useCallback, useMemo } from 'react'
import { getCutEngine } from '../publicodes/cut-engine'
import { studySiteToSituation } from '../publicodes/studySiteToSituation'
import { CutSituation } from '../publicodes/types'

const { Provider, useContext: useCutPublicodes } = createPublicodesFormContext<CutSituation>('CUT')

export interface CutPublicodesProviderProps {
  children: ReactNode
  studyId: string
  studySiteId: string
  study: FullStudy
}

export function CutPublicodesProvider({ children, studyId, studySiteId, study }: CutPublicodesProviderProps) {
  const t = useTranslations('saveStatus')
  const { showSuccessToast } = useToast()
  const studySite = useMemo(() => study.sites.find((site) => site.id === studySiteId), [study.sites, studySiteId])

  const mergeSituation = useMemo(
    () => (loadedSituation: CutSituation) => ({
      ...loadedSituation,
      ...studySiteToSituation(studySite),
    }),
    [studySite],
  )

  const handleSyncUpdate = useCallback(() => {
    showSuccessToast(t('syncedFromOtherUser'))
  }, [showSuccessToast, t])

  const publicodes = usePublicodesForm<CutSituation>({
    studyId,
    studySiteId,
    modelVersion: PUBLICODES_COUNT_VERSION,
    engineFactory: getCutEngine,
    mergeSituation,
    syncIntervalMs: 5000,
    onSyncUpdate: handleSyncUpdate,
  })

  useBeforeUnload({
    when: publicodes.autoSave.hasUnsavedChanges,
  })

  return <Provider value={publicodes}>{children}</Provider>
}

export { useCutPublicodes }
