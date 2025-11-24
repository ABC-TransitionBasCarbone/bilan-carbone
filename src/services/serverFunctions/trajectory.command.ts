import { setCustomIssue, setCustomMessage } from '@/lib/zod.config'
import { TrajectoryType } from '@prisma/client'
import { z } from 'zod'

export const createObjectiveSchema = () =>
  z
    .object({
      id: z.string().optional(),
      targetYear: z.string().optional().nullable(),
      reductionRate: z
        .number()
        .optional()
        .nullable()
        .refine((val) => {
          if (val === null || val === undefined) {
            return true
          }
          // Check if the number has at most 2 decimal places
          const decimalPlaces = (val.toString().split('.')[1] || '').length
          return decimalPlaces <= 2
        }, setCustomMessage('maxTwoDecimals')),
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
      (data) => {
        if (data.trajectoryType !== TrajectoryType.CUSTOM) {
          return true
        }
        return data.objectives.length > 0
      },
      setCustomIssue(['objectives'], 'atLeastOneObjective'),
    )
}
export type TrajectoryFormData = z.infer<ReturnType<typeof createTrajectorySchema>>
