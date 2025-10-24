import { TrajectoryType } from '@prisma/client'
import { z } from 'zod'

export const createObjectiveSchema = (t: (key: string) => string) =>
  z
    .object({
      id: z.string().optional(),
      targetYear: z.string().optional().nullable(),
      reductionRate: z.number().optional().nullable(),
    })
    .refine(
      (data) => {
        const hasTargetYear = data.targetYear !== undefined && data.targetYear !== null
        const hasReductionRate = data.reductionRate !== undefined && data.reductionRate !== null
        const isEmpty = !hasTargetYear && !hasReductionRate
        const isFull = hasTargetYear && hasReductionRate
        return isEmpty || isFull
      },
      { message: t('objectiveBothRequired') },
    )

export const createTrajectorySchema = (t: (key: string) => string) => {
  const objectiveSchema = createObjectiveSchema(t)
  return z
    .object({
      trajectoryType: z.nativeEnum(TrajectoryType),
      name: z.string({ required_error: t('required') }).min(1, t('required')),
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
      (data) => {
        if (data.trajectoryType !== TrajectoryType.CUSTOM) {
          return true
        }
        return data.objectives.length > 0
      },
      { message: t('atLeastOneObjective'), path: ['objectives'] },
    )
}
export type TrajectoryFormData = z.infer<ReturnType<typeof createTrajectorySchema>>
