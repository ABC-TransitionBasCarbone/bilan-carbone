'use client'

import { useToast } from '@/components/base/ToastProvider'
import { SEC, TIME_IN_MS } from '@/utils/time'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'
import { useCutPublicodes } from '../context/publicodesContext'

const TOAST_DURATION = 2 * SEC * TIME_IN_MS

const CutSaveStatusIndicator = () => {
  const { autoSave, isLoading, error } = useCutPublicodes()
  const { showSuccessToast, showErrorToast } = useToast()
  const t = useTranslations('saveStatus')
  const previousStatusRef = useRef(autoSave.saveStatus)

  useEffect(() => {
    const previousStatus = previousStatusRef.current
    const currentStatus = autoSave.saveStatus

    if (previousStatus !== currentStatus) {
      if (currentStatus === 'saved') {
        showSuccessToast(t('saved'), TOAST_DURATION)
      } else if (currentStatus === 'error' && autoSave.error) {
        showErrorToast(autoSave.error, TOAST_DURATION)
      }
    }

    previousStatusRef.current = currentStatus
  }, [autoSave.saveStatus, autoSave.error, isLoading, error, showSuccessToast, showErrorToast, t])

  return null
}

export default CutSaveStatusIndicator
