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
  const tGeneralError = useTranslations('error')
  const generalErrorMessage = tGeneralError('default')

  const callServerFunction = useCallback(
    async <T>(
      serverFunction: () => Promise<ApiResponse<T>>,
      options?: {
        getSuccessMessage?: (data: T) => string
        getErrorMessage?: (errorMessage: string) => string
        onSuccess?: (data: T) => void
        onError?: (errorMessage: string) => void
      },
    ): Promise<ApiResponse<T>> => {
      const result = await serverFunction()

      if (result.success) {
        if (options?.getSuccessMessage) {
          const successMessage = options.getSuccessMessage(result.data)
          showSuccessToast(successMessage)
        }
        options?.onSuccess?.(result.data)
      } else {
        const resultErrorMessage = result.errorMessage
        let errorMessage = generalErrorMessage

        if (options?.getErrorMessage) {
          errorMessage = options.getErrorMessage(resultErrorMessage)
        } else if (tGeneralError.has(resultErrorMessage)) {
          // Fallback to general error translations
          errorMessage = tGeneralError(resultErrorMessage)
        }

        showErrorToast(errorMessage)
        options?.onError?.(result.errorMessage)
      }

      return result
    },
    [generalErrorMessage, showErrorToast, showSuccessToast, tGeneralError],
  )

  return { callServerFunction }
}
