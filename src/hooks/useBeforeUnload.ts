import { useEffect } from 'react'

interface UseBeforeUnloadOptions {
  when: boolean
  message?: string
}

/**
 * Hook to warn users before leaving the page when there are unsaved changes with default browser message
 */
export const useBeforeUnload = ({ when }: UseBeforeUnloadOptions) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!when) {
        return
      }

      event.preventDefault()
      return null
    }

    if (when) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [when])
}
