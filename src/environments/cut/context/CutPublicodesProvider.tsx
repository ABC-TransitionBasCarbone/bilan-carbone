'use client'

import { useToast } from '@/components/base/ToastProvider'
import { createPublicodesFormContext } from '@/components/publicodes-form/PublicodesFormContext'
import { PUBLICODES_COUNT_VERSION } from '@/constants/versions'
import { useBeforeUnload } from '@/hooks/useBeforeUnload'
import { usePublicodesForm } from '@/hooks/usePublicodesForm'
import { useTranslations } from 'next-intl'
import { ReactNode, useMemo } from 'react'
import { getCutEngine } from '../publicodes/cut-engine'
import { CutSituation } from '../publicodes/types'

const { PublicodesFormProvider, usePublicodesFormContext: useCutPublicodes } =
  createPublicodesFormContext<CutSituation>('CUT')

export interface CutPublicodesProviderProps {
  children: ReactNode
  studyId: string
  studySiteId: string
}

export function CutPublicodesProvider({ children, studyId, studySiteId }: CutPublicodesProviderProps) {
  const t = useTranslations('saveStatus')
  const { showSuccessToast } = useToast()
  const engine = useMemo(() => getCutEngine().shallowCopy(), [])

  const publicodes = usePublicodesForm<CutSituation>({
    studyId,
    studySiteId,
    modelVersion: PUBLICODES_COUNT_VERSION,
    engine,
    syncIntervalMs: 5000,
    onSyncUpdate: () => showSuccessToast(t('syncedFromOtherUser')),
  })

  useBeforeUnload({
    when: publicodes.autoSave.hasUnsavedChanges,
  })

  return <PublicodesFormProvider value={publicodes}>{children}</PublicodesFormProvider>
}

export { useCutPublicodes }
