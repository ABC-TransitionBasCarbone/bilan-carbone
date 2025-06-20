import { zodResolver } from '@hookform/resolvers/zod'
import { Answer, Question } from '@prisma/client'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { answersToFormValues } from '../mappers/answersToForm'
import { FormValues } from '../types/formTypes'
import { useDynamicValidation } from '../validation/dynamicFormSchema'

export const useDynamicForm = (questions: Question[], initialAnswers?: Answer[]) => {
  const schema = useDynamicValidation(questions)

  const defaultValues = useMemo(() => {
    return answersToFormValues(questions, initialAnswers)
  }, [questions, initialAnswers])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema as z.ZodSchema<FormValues>),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues,
  })

  return form
}
