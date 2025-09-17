import { saveAnswerForQuestion } from '@/services/serverFunctions/question'
import { Prisma, Question } from '@prisma/client'
import { useCallback, useMemo, useRef, useState } from 'react'

export interface FieldSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error'
  error?: string
  lastSaved?: Date
}

export interface UseAutoSaveReturn {
  saveField: (question: Question, value: Prisma.InputJsonValue) => Promise<void>
  saveTableField: (tableQuestion: Question, currentTableData: Prisma.InputJsonValue) => void
  clearPendingTableSave: (questionId: string) => void
  hasUnsavedChanges: () => boolean
  getFieldStatus: (questionId: string) => FieldSaveStatus
  initializeFieldStatus: (questionId: string, status: FieldSaveStatus['status']) => void
  setInitialValue: (questionId: string, value: Prisma.InputJsonValue) => void
  studySiteId: string
}

interface SaveAnswerRequest {
  question: Question
  studyId: string
  studySiteId: string
  response: Prisma.InputJsonValue
}

/**
 * Hook for auto-saving form fields with debouncing
 */
export const useAutoSave = (studyId: string, studySiteId: string): UseAutoSaveReturn => {
  const [fieldStatuses, setFieldStatuses] = useState<Record<string, FieldSaveStatus>>({})
  const tableDebounceTimers = useRef<Record<string, NodeJS.Timeout>>({})
  const initialValues = useRef<Record<string, Prisma.InputJsonValue>>({})

  const saveAnswer = useCallback(
    async (request: SaveAnswerRequest) => {
      return saveAnswerForQuestion(request.question, request.response, studyId, studySiteId)
    },
    [studyId, studySiteId],
  )

  const updateFieldStatus = useCallback((questionId: string, status: Partial<FieldSaveStatus>) => {
    setFieldStatuses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        ...status,
      },
    }))
  }, [])

  const valuesAreEqual = useCallback((value1: Prisma.InputJsonValue, value2: Prisma.InputJsonValue): boolean => {
    if (value1 === value2) {
      return true
    }
    if (!value1 && !value2) {
      return true
    }
    if (!value1 || !value2) {
      return false
    }

    const str1 = typeof value1 === 'string' ? value1 : JSON.stringify(value1)
    const str2 = typeof value2 === 'string' ? value2 : JSON.stringify(value2)

    return str1 === str2
  }, [])

  const performSave = useCallback(
    async (question: Question, value: Prisma.InputJsonValue) => {
      try {
        const initialValue = initialValues.current[question.id]
        if (initialValue !== undefined && valuesAreEqual(value, initialValue)) {
          // Value hasn't changed from initial, don't save
          updateFieldStatus(question.id, { status: 'idle' })
          return
        }

        const request: SaveAnswerRequest = {
          question,
          studyId,
          studySiteId,
          response: formatValueForSave(value),
        }

        const result = await saveAnswer(request)

        if (result.success) {
          if (isEmptyValue(value)) {
            updateFieldStatus(question.id, { status: 'idle' })
            return
          }

          initialValues.current[question.id] = value

          updateFieldStatus(question.id, {
            status: 'saved',
            error: undefined,
            lastSaved: new Date(),
          })
        } else {
          updateFieldStatus(question.id, {
            status: 'error',
            error: 'Failed to save',
          })
        }
      } catch (error) {
        updateFieldStatus(question.id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
    [studyId, studySiteId, saveAnswer, updateFieldStatus, valuesAreEqual],
  )

  const saveField = useCallback(
    async (question: Question, value: Prisma.InputJsonValue) => {
      updateFieldStatus(question.id, { status: 'saving' })
      await performSave(question, value)
    },
    [performSave, updateFieldStatus],
  )

  const getFieldStatus = useCallback(
    (questionId: string): FieldSaveStatus => {
      return fieldStatuses[questionId] || { status: 'idle' }
    },
    [fieldStatuses],
  )

  const saveTableField = useCallback(
    (tableQuestion: Question, currentTableData: Prisma.InputJsonValue) => {
      const questionId = tableQuestion.id

      if (tableDebounceTimers.current[questionId]) {
        clearTimeout(tableDebounceTimers.current[questionId])
      }

      updateFieldStatus(questionId, { status: 'saving' })

      tableDebounceTimers.current[questionId] = setTimeout(async () => {
        try {
          await performSave(tableQuestion, currentTableData)
        } catch (error) {
          updateFieldStatus(questionId, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        } finally {
          delete tableDebounceTimers.current[questionId]
        }
      }, 1000)
    },
    [updateFieldStatus, performSave],
  )

  const initializeFieldStatus = useCallback(
    (questionId: string, status: FieldSaveStatus['status']) => {
      updateFieldStatus(questionId, { status })
    },
    [updateFieldStatus],
  )

  const setInitialValue = useCallback((questionId: string, value: Prisma.InputJsonValue) => {
    initialValues.current[questionId] = value
  }, [])

  const clearPendingTableSave = useCallback(
    (questionId: string) => {
      if (tableDebounceTimers.current[questionId]) {
        clearTimeout(tableDebounceTimers.current[questionId])
        delete tableDebounceTimers.current[questionId]
        updateFieldStatus(questionId, { status: 'idle' })
      }
    },
    [updateFieldStatus],
  )

  const hasUnsavedChanges = useCallback(() => {
    const hasPendingTimers = Object.keys(tableDebounceTimers.current).length > 0
    const hasSavingFields = Object.values(fieldStatuses).some((status) => status.status === 'saving')

    return hasPendingTimers || hasSavingFields
  }, [fieldStatuses])

  return useMemo(
    () => ({
      saveField,
      saveTableField,
      clearPendingTableSave,
      hasUnsavedChanges,
      getFieldStatus,
      initializeFieldStatus,
      setInitialValue,
      studySiteId,
    }),
    [
      saveField,
      saveTableField,
      clearPendingTableSave,
      hasUnsavedChanges,
      getFieldStatus,
      initializeFieldStatus,
      setInitialValue,
      studySiteId,
    ],
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

  return value
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
