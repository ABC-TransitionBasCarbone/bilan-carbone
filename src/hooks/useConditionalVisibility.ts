import { emissionFactorMap } from '@/constants/emissionFactorMap'
import { cleanupHiddenQuestion } from '@/services/serverFunctions/question'
import { Question } from '@prisma/client'
import { useEffect, useMemo, useRef } from 'react'
import { UseFormSetValue, UseFormWatch } from 'react-hook-form'

export const useConditionalVisibility = (
  questions: Question[],
  watch: UseFormWatch<Record<string, unknown>>,
  studySiteId?: string,
  setValue?: UseFormSetValue<Record<string, unknown>>,
) => {
  const watchedValues = watch()
  const previousVisibleQuestionsRef = useRef<Set<string>>(new Set())

  const visibleQuestions = useMemo(() => {
    return questions.filter((question) => {
      const emissionInfo = emissionFactorMap[question.idIntern]

      if (!emissionInfo?.conditionalRules || emissionInfo.conditionalRules.length === 0) {
        return true
      }

      return emissionInfo.conditionalRules.every((rule) => {
        const parentValue = watchedValues[rule.idIntern]

        if (parentValue === undefined || parentValue === null || parentValue === '') {
          return false
        }

        return rule.expectedAnswers.includes(String(parentValue))
      })
    })
  }, [questions, watchedValues])

  useEffect(() => {
    if (!studySiteId) {
      return
    }

    const currentVisibleQuestions = new Set(visibleQuestions.map((q) => q.idIntern))
    const previousVisibleQuestions = previousVisibleQuestionsRef.current

    const newlyHiddenQuestions = [...previousVisibleQuestions].filter(
      (idIntern) => !currentVisibleQuestions.has(idIntern),
    )

    newlyHiddenQuestions.forEach(async (questionIdIntern) => {
      try {
        if (setValue) {
          setValue(questionIdIntern, '', { shouldValidate: false, shouldDirty: false })

          const allFormValues = watchedValues
          Object.keys(allFormValues).forEach((fieldName) => {
            if (fieldName.startsWith(`${questionIdIntern}-`)) {
              setValue(fieldName, '', { shouldValidate: false, shouldDirty: false })
            }
          })
        }

        await cleanupHiddenQuestion(questionIdIntern, studySiteId)
      } catch (error) {
        console.error(`Failed to cleanup answer and emission sources for question ${questionIdIntern}:`, error)
      }
    })

    previousVisibleQuestionsRef.current = currentVisibleQuestions
  }, [visibleQuestions, studySiteId, setValue, watchedValues])

  return visibleQuestions
}
