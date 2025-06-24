import { saveAnswerForQuestion } from '@/services/serverFunctions/question'
import { Prisma } from '@prisma/client'
import { useCallback, useMemo, useState } from 'react'

export interface FieldSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error'
  error?: string
  lastSaved?: Date
}

export interface UseAutoSaveReturn {
  saveField: (questionId: string, value: Prisma.InputJsonValue) => void
  getFieldStatus: (questionId: string) => FieldSaveStatus
  initializeFieldStatus: (questionId: string, status: FieldSaveStatus['status']) => void
}

interface SaveAnswerRequest {
  questionId: string
  studyId: string
  response: Prisma.InputJsonValue
}

/**
 * Hook for auto-saving form fields with debouncing
 */
export const useAutoSave = (studyId: string): UseAutoSaveReturn => {
  const [fieldStatuses, setFieldStatuses] = useState<Record<string, FieldSaveStatus>>({})

  const saveAnswer = useCallback(async (request: SaveAnswerRequest) => {
    return saveAnswerForQuestion(request.questionId, request.studyId, request.response)
  }, [])

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
    async (questionId: string, value: Prisma.InputJsonValue) => {
      try {
        const request: SaveAnswerRequest = {
          questionId,
          studyId,
          response: formatValueForSave(value),
        }

        const result = await saveAnswer(request)

        if (result.success) {
          if (isEmptyValue(value)) {
            updateFieldStatus(questionId, { status: 'idle' })
            return
          }

          updateFieldStatus(questionId, {
            status: 'saved',
            error: undefined,
            lastSaved: new Date(),
          })
        } else {
          updateFieldStatus(questionId, {
            status: 'error',
            error: 'Failed to save',
          })
        }
      } catch (error) {
        updateFieldStatus(questionId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
    [studyId, updateFieldStatus, saveAnswer],
  )

  const saveField = useCallback(
    (questionId: string, value: Prisma.InputJsonValue) => {
      updateFieldStatus(questionId, { status: 'saving' })
      performSave(questionId, value)
    },
    [performSave, updateFieldStatus],
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
      initializeFieldStatus,
    }),
    [saveField, getFieldStatus, initializeFieldStatus],
  )
}

function formatValueForSave(value: Prisma.InputJsonValue): Prisma.InputJsonValue {
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
function isEmptyValue(value: Prisma.InputJsonValue): boolean {
  if (value === null || value === undefined || value === '') {
    return true
  }

  if (Array.isArray(value)) {
    return value.length === 0
  }

  return false
}
