import { answersToFormValues } from '@/utils/question'
import { zodResolver } from '@hookform/resolvers/zod'
import { Answer, Question } from '@prisma/client'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { FormValues } from '../components/dynamic-form/types/formTypes'
import { useDynamicValidation } from '../components/dynamic-form/validation/dynamicFormSchema'

export const useDynamicForm = (questions: Question[], initialAnswers?: Answer[]) => {
  const schema = useDynamicValidation(questions)

  const defaultValues = useMemo(() => {
    return answersToFormValues(questions, initialAnswers)
  }, [questions, initialAnswers])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues,
  })

  return form
}
