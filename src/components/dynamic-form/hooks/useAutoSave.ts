import { useCallback, useMemo, useRef, useState } from 'react'
import { AutoSaveApiService, SaveAnswerRequest } from '../services/autoSaveApi'

export interface FieldSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error'
  error?: string
  lastSaved?: Date
}

export interface UseAutoSaveReturn {
  saveField: (questionId: string, value: unknown) => void
  getFieldStatus: (questionId: string) => FieldSaveStatus
  clearField: (questionId: string) => void
  initializeFieldStatus: (questionId: string, status: FieldSaveStatus['status']) => void
}

/**
 * Hook for auto-saving form fields with debouncing
 */
export const useAutoSave = (studyId: string, debounceMs: number = 1000): UseAutoSaveReturn => {
  const [fieldStatuses, setFieldStatuses] = useState<Record<string, FieldSaveStatus>>({})
  const saveTimers = useRef<Record<string, NodeJS.Timeout>>({})

  const updateFieldStatus = useCallback((questionId: string, status: Partial<FieldSaveStatus>) => {
    setFieldStatuses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        ...status,
      },
    }))
  }, [])

  const performSave = useCallback(
    async (questionId: string, value: unknown) => {
      updateFieldStatus(questionId, { status: 'saving' })

      try {
        const request: SaveAnswerRequest = {
          questionId,
          studyId,
          response: formatValueForSave(value),
        }

        const result = await AutoSaveApiService.saveAnswer(request)

        if (result.success) {
          updateFieldStatus(questionId, {
            status: 'saved',
            error: undefined,
            lastSaved: new Date(),
          })
        } else {
          updateFieldStatus(questionId, {
            status: 'error',
            error: result.error || 'Failed to save',
          })
        }
      } catch (error) {
        updateFieldStatus(questionId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
    [studyId, updateFieldStatus],
  )

  const saveField = useCallback(
    (questionId: string, value: unknown) => {
      // Clear existing timer for this field
      if (saveTimers.current[questionId]) {
        clearTimeout(saveTimers.current[questionId])
      }

      // Don't save empty values
      if (isEmptyValue(value)) {
        updateFieldStatus(questionId, { status: 'idle' })
        return
      }

      // Set timer for debounced save
      saveTimers.current[questionId] = setTimeout(() => {
        performSave(questionId, value)
        delete saveTimers.current[questionId]
      }, debounceMs)

      // Show pending state immediately
      updateFieldStatus(questionId, { status: 'idle' })
    },
    [debounceMs, performSave, updateFieldStatus],
  )

  const clearField = useCallback(
    async (questionId: string) => {
      // Clear any pending save
      if (saveTimers.current[questionId]) {
        clearTimeout(saveTimers.current[questionId])
        delete saveTimers.current[questionId]
      }

      updateFieldStatus(questionId, { status: 'saving' })

      try {
        await AutoSaveApiService.deleteAnswer(questionId, studyId)
        updateFieldStatus(questionId, { status: 'idle' })
      } catch (error) {
        updateFieldStatus(questionId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to clear field',
        })
      }
    },
    [studyId, updateFieldStatus],
  )

  const getFieldStatus = useCallback(
    (questionId: string): FieldSaveStatus => {
      return fieldStatuses[questionId] || { status: 'idle' }
    },
    [fieldStatuses],
  )

  const initializeFieldStatus = useCallback(
    (questionId: string, status: FieldSaveStatus['status']) => {
      updateFieldStatus(questionId, { status })
    },
    [updateFieldStatus],
  )

  return useMemo(
    () => ({
      saveField,
      getFieldStatus,
      clearField,
      initializeFieldStatus,
    }),
    [saveField, getFieldStatus, clearField, initializeFieldStatus],
  )
}

/**
 * Format value for API save
 */
function formatValueForSave(value: unknown): string | string[] {
  if (value === null || value === undefined) {
    return ''
  }

  if (Array.isArray(value)) {
    return value.map((v) => String(v))
  }

  if (typeof value === 'boolean') {
    return value.toString()
  }

  return String(value)
}

/**
 * Check if value is considered empty
 */
function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') {
    return true
  }

  if (Array.isArray(value)) {
    return value.length === 0
  }

  return false
}
