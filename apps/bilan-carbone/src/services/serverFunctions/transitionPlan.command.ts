import { setCustomMessage } from '@/lib/zod.config'
import z from 'zod'

export const ExternalStudyFormValidation = z.object({
  transitionPlanId: z.string().min(1),
  externalStudyId: z.string().optional(),
  name: z.string().min(1),
  date: z.union([z.string(), z.date()]).transform((val) => (typeof val === 'string' ? val : val.toISOString())),
  totalCo2Value: z.number().min(0),
})

export const createExternalStudyFormValidation = (currentStudyYear: number) => {
  return ExternalStudyFormValidation.refine(
    (data) => {
      const dateValue = new Date(data.date)
      const studyYear = dateValue.getFullYear()
      return studyYear < currentStudyYear
    },
    {
      ...setCustomMessage('studyYearMustBeBeforeCurrent'),
      path: ['date'],
    },
  )
}

export type ExternalStudyFormInput = z.input<typeof ExternalStudyFormValidation>
