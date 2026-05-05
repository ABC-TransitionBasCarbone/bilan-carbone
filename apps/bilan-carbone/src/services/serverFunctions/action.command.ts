import { setCustomMessage } from '@/lib/zod.config'
import {
  ActionCategory,
  ActionIndicatorType,
  ActionNature,
  ActionPotentialDeduction,
  ActionRelevance,
  SubPost,
} from '@repo/db-common/enums'
import { z } from 'zod'

const ActionIndicatorSchema = z.object({
  id: z.string().optional(),
  type: z.enum(ActionIndicatorType),
  description: z.string(),
})

export type ActionIndicatorCommand = z.infer<typeof ActionIndicatorSchema>

const ActionStepSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  order: z.number().int(),
})

export type ActionStepCommand = z.infer<typeof ActionStepSchema>

export const AddActionCommandBase = (hasTagFamilies: boolean) => {
  return z.object({
    title: z.string().min(1),
    detailedDescription: z.string().optional(),
    transitionPlanId: z.uuid(),
    potentialDeduction: z.enum(ActionPotentialDeduction),
    reductionValue: z.number().optional().nullable(),
    reductionDetails: z.string().optional(),
    reductionStartYear: z.string().min(1),
    reductionEndYear: z.string().min(1),
    owner: z.string().optional(),
    necessaryBudget: z.number().optional(),
    necesssaryRessources: z.string().optional(),
    indicators: z.array(ActionIndicatorSchema).optional(),
    steps: z.array(ActionStepSchema).min(0),
    facilitatorsAndObstacles: z.string().optional(),
    additionalInformation: z.string().optional(),
    nature: z.array(z.enum(ActionNature)).min(0),
    category: z.array(z.enum(ActionCategory)).min(0),
    relevance: z.array(z.enum(ActionRelevance)).min(0),
    enabled: z.boolean().optional(),
    siteIds: z.array(z.string()).min(1),
    tagIds: hasTagFamilies ? z.array(z.string()).min(1) : z.array(z.string()).optional(),
    subPosts: z.array(z.enum(SubPost)).min(1),
  })
}

export const createAddActionCommandValidation = (hasTagFamilies: boolean) =>
  AddActionCommandBase(hasTagFamilies).refine(
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

export type AddActionFormCommand = z.infer<ReturnType<typeof createAddActionCommandValidation>>

export type AddActionInputCommand = Omit<
  z.input<ReturnType<typeof createAddActionCommandValidation>>,
  'reductionValue'
> & {
  reductionValueKg: number | null | undefined
}
