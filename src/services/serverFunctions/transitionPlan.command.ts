import { setCustomIssue, setCustomMessage } from '@/lib/zod.config'
import { TrajectoryType } from '@prisma/client'
import dayjs from 'dayjs'
import z from 'zod'

export const ExternalStudyCommandValidation = z.object({
  transitionPlanId: z.string().min(1),
  name: z.string().min(1),
  date: z.string().refine((val) => dayjs(val).isValid()),
  totalCo2: z.number().min(0),
})

export type ExternalStudyCommand = z.infer<typeof ExternalStudyCommandValidation>

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
