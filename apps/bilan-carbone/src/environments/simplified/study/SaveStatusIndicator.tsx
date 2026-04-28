'use client'

import { useToast } from '@repo/ui'
import { usePublicodesForm } from '@/lib/publicodes/context'
import { SEC, TIME_IN_MS } from '@repo/utils'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'

const TOAST_DURATION = 2 * SEC * TIME_IN_MS

const SaveStatusIndicator = () => {
  const { saveStatus, isLoading, error, saveError } = usePublicodesForm()
  const { showSuccessToast, showErrorToast } = useToast()
  const t = useTranslations('saveStatus')
  const previousStatusRef = useRef(saveStatus)

  useEffect(() => {
    const previousStatus = previousStatusRef.current
    const currentStatus = saveStatus

    if (previousStatus !== currentStatus) {
      if (currentStatus === 'error' && saveError) {
        showErrorToast(saveError, TOAST_DURATION)
      }
    }

    previousStatusRef.current = currentStatus
  }, [saveStatus, saveError, isLoading, error, showSuccessToast, showErrorToast, t])

  return null
}

export default SaveStatusIndicator
