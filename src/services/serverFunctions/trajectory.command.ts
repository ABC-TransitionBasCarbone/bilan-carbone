import { setCustomIssue, setCustomMessage } from '@/lib/zod.config'
import { TrajectoryType } from '@prisma/client'
import { z } from 'zod'

export const sectorPercentagesSchema = z
  .object({
    energy: z.number().min(0).max(100),
    industry: z.number().min(0).max(100),
    waste: z.number().min(0).max(100),
    buildings: z.number().min(0).max(100),
    agriculture: z.number().min(0).max(100),
    transportation: z.number().min(0).max(100),
  })
  .refine((data) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0)
    return total <= 100
  }, setCustomMessage('sectorPercentagesTotalExceeds100'))

export type SectorPercentages = z.infer<typeof sectorPercentagesSchema>

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
      referenceYear: z.string().optional().nullable(),
      objectives: z.array(objectiveSchema),
      sectorPercentages: sectorPercentagesSchema.optional().nullable(),
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
    .refine(
      (data) =>
        data.trajectoryType !== TrajectoryType.SNBC_SECTORAL ||
        (data.sectorPercentages !== null && data.sectorPercentages !== undefined),
      setCustomIssue(['sectorPercentages'], 'sectorPercentagesRequired'),
    )
}

export type TrajectoryFormData = z.infer<ReturnType<typeof createTrajectorySchema>>
