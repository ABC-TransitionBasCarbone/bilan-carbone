'use client'

import { useToast } from '@/components/base/ToastProvider'
import { ApiResponse } from '@/utils/serverResponse'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect } from 'react'

/**
 * Client-only hook that wraps server function calls with automatic error toast handling
 * Automatically shows error toasts when server functions return { success: false }
 */
export const useServerFunction = () => {
  // Runtime check to ensure we're in a client component
  useEffect(() => {
    if (typeof window === 'undefined') {
      throw new Error(
        'useServerFunction can only be used in client components. Add "use client" directive to your component.',
      )
    }
  }, [])

  const { showErrorToast, showSuccessToast } = useToast()
  const t = useTranslations('error')
  const generalErrorMessage = t('default')

  const callServerFunction = useCallback(
    async <T>(
      serverFunction: () => Promise<ApiResponse<T>>,
      options?: {
        successMessage?: string // If provided, will show a success toast with this message
        customErrorMessage?: string
        translationFn?: ReturnType<typeof useTranslations> // Translation function mapped to the specific error namespace
        onSuccess?: (data: T) => void
        onError?: (errorMessage: string) => void
      },
    ): Promise<ApiResponse<T>> => {
      const result = await serverFunction()

      if (result.success) {
        if (options?.successMessage) {
          showSuccessToast(options.successMessage)
        }
        options?.onSuccess?.(result.data)
      } else {
        const resultErrorMessage = result.errorMessage
        let errorMessage = generalErrorMessage

        // Try custom translation function
        if (options?.translationFn && options.translationFn.has(resultErrorMessage)) {
          errorMessage = options.translationFn(resultErrorMessage)
        } else if (t.has(resultErrorMessage)) {
          // Check in the general error translation group if the key exists
          errorMessage = t(resultErrorMessage)
        }

        showErrorToast(errorMessage)
        options?.onError?.(result.errorMessage)
      }

      return result
    },
    [generalErrorMessage, showErrorToast, showSuccessToast, t],
  )

  return { callServerFunction }
}
