import { setCustomMessage } from '@/lib/zod.config'
import {
  ActionCategory,
  ActionIndicatorType,
  ActionNature,
  ActionPotentialDeduction,
  ActionRelevance,
} from '@prisma/client'
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

export const ActionIndicatorSchema = z.object({
  id: z.string().optional(),
  type: z.enum(ActionIndicatorType),
  description: z.string(),
})

export type ActionIndicatorCommand = z.infer<typeof ActionIndicatorSchema>

export const ActionStepSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  order: z.number().int(),
})

export type ActionStepCommand = z.infer<typeof ActionStepSchema>

export const AddActionCommandBase = z.object({
  title: z.string().min(1),
  detailedDescription: z.string().min(1),
  transitionPlanId: z.uuid(),
  potentialDeduction: z.enum(ActionPotentialDeduction),
  reductionValue: z.number().optional().nullable(),
  reductionDetails: z.string().optional(),
  reductionStartYear: z.string(),
  reductionEndYear: z.string(),
  owner: z.string().optional(),
  necessaryBudget: z.number().optional(),
  necesssaryRessources: z.string().optional(),
  indicators: z.array(ActionIndicatorSchema).optional(),
  steps: z.array(ActionStepSchema).min(1),
  facilitatorsAndObstacles: z.string().optional(),
  additionalInformation: z.string().optional(),
  nature: z.array(z.enum(ActionNature)).min(0),
  category: z.array(z.enum(ActionCategory)).min(0),
  relevance: z.array(z.enum(ActionRelevance)).min(0),
  enabled: z.boolean().optional(),
  dependenciesOnly: z.boolean().optional(),
})

export const AddActionCommandValidation = AddActionCommandBase.refine(
  (data) => {
    if (data.potentialDeduction === ActionPotentialDeduction.Quantity) {
      return data.reductionValue !== undefined && data.reductionValue !== null
    }
    return true
  },
  {
    ...setCustomMessage('required'),
    path: ['reductionValue'],
  },
)

export type AddActionFormCommand = z.infer<typeof AddActionCommandValidation>
export type AddActionInputCommand = Omit<z.input<typeof AddActionCommandValidation>, 'reductionValue'> & {
  reductionValueKg: number | null | undefined
}
