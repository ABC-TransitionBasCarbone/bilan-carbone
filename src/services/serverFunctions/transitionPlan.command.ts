import { setCustomIssue, setCustomMessage } from '@/lib/zod.config'
import {
  ActionCategory,
  ActionIndicatorType,
  ActionNature,
  ActionPotentialDeduction,
  ActionRelevance,
  TrajectoryType,
} from '@prisma/client'
import z from 'zod'

export const ExternalStudyCommandValidation = z.object({
  transitionPlanId: z.string().min(1),
  externalStudyId: z.string().optional(),
  name: z.string().min(1),
  date: z.union([z.string(), z.date()]).transform((val) => (typeof val === 'string' ? val : val.toISOString())),
  totalCo2: z.number().min(0),
})

export const createExternalStudyCommandValidation = (currentStudyYear: number) => {
  return ExternalStudyCommandValidation.refine(
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

export type ExternalStudyCommand = z.infer<typeof ExternalStudyCommandValidation>
export type ExternalStudyFormInput = z.input<typeof ExternalStudyCommandValidation>

export const createObjectiveSchema = () =>
  z
    .object({
      targetYear: z.string().optional().nullable(),
      reductionRate: z.number().optional().nullable(),
    })
    .refine((data) => {
      const hasTargetYear = data.targetYear !== undefined && data.targetYear !== null
      const hasReductionRate = data.reductionRate !== undefined && data.reductionRate !== null
      const isEmpty = !hasTargetYear && !hasReductionRate
      const isFull = hasTargetYear && hasReductionRate
      return isEmpty || isFull
    }, setCustomMessage('objectiveIncomplete'))

export const createTrajectorySchema = () => {
  const objectiveSchema = createObjectiveSchema()
  return z
    .object({
      trajectoryType: z.enum(TrajectoryType),
      name: z.string().min(1),
      description: z.string().optional(),
      objectives: z.array(objectiveSchema),
    })
    .transform((data) => ({
      ...data,
      objectives: data.objectives.filter(
        (obj) =>
          obj.targetYear !== undefined &&
          obj.targetYear !== null &&
          obj.reductionRate !== undefined &&
          obj.reductionRate !== null,
      ),
    }))
    .refine(
      (data) => data.trajectoryType !== TrajectoryType.CUSTOM || data.objectives.length > 0,
      setCustomIssue(['objectives'], 'atLeastOneObjective'),
    )
}

export type TrajectoryFormData = z.infer<ReturnType<typeof createTrajectorySchema>>

export const ActionIndicatorSchema = z.object({
  id: z.string().optional(),
  type: z.enum(ActionIndicatorType),
  description: z.string(),
})

export type ActionIndicatorCommand = z.infer<typeof ActionIndicatorSchema>

export const AddActionCommandBase = z.object({
  title: z.string().min(1),
  subSteps: z.string().min(1),
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
  implementationDescription: z.string().optional(),
  implementationGoal: z.number().optional(),
  followUpDescription: z.string().optional(),
  followUpGoal: z.number().optional(),
  performanceDescription: z.string().optional(),
  performanceGoal: z.number().optional(),
  indicators: z.array(ActionIndicatorSchema).optional(),
  facilitatorsAndObstacles: z.string().optional(),
  additionalInformation: z.string().optional(),
  nature: z.array(z.enum(ActionNature)).min(0),
  category: z.array(z.enum(ActionCategory)).min(0),
  relevance: z.array(z.enum(ActionRelevance)).min(0),
  enabled: z.boolean().optional(),
  dependenciesOnly: z.boolean().optional(),
})

export const AddActionCommandValidation = AddActionCommandBase.refine((data) => {
  if (data.potentialDeduction === ActionPotentialDeduction.Quantity) {
    return data.reductionValue !== undefined && data.reductionValue !== null
  }
  return true
}, setCustomMessage('required'))

export type AddActionCommand = z.infer<typeof AddActionCommandValidation>
