import { setCustomIssue } from '@/lib/zod.config'
import { SubPost } from  '@repo/db-common/enums'
import { z } from 'zod'

export const createObjectiveFormSchema = () =>
  z
    .object({
      startYear: z.string().min(1),
      targetYear: z.string().min(1),
      reductionRate: z.number(),
    })
    .superRefine((data, ctx) => {
      const startYear = parseInt(data.startYear, 10)
      const targetYear = parseInt(data.targetYear, 10)
      if (startYear >= targetYear) {
        ctx.addIssue(setCustomIssue(['startYear'], 'startYearMustBeBeforeTargetYear'))
        ctx.addIssue(setCustomIssue(['targetYear'], 'startYearMustBeBeforeTargetYear'))
      }
    })

export const createObjectiveModalSchema = ({ hasTagFamilies = true }: { hasTagFamilies?: boolean } = {}) => {
  const objectiveFormSchema = createObjectiveFormSchema()
  return z
    .object({
      siteIds: z.array(z.string()).min(1),
      tagIds: hasTagFamilies ? z.array(z.string()).min(1) : z.array(z.string()).optional(),
      subPosts: z.array(z.enum(SubPost)).min(1),
      objectives: z.array(objectiveFormSchema),
    })
    .refine(
      (data) => {
        return data.objectives.some(
          (obj) => obj.targetYear && obj.startYear && obj.reductionRate !== null && obj.reductionRate !== undefined,
        )
      },
      setCustomIssue(['objectives'], 'atLeastOneValidObjective'),
    )
}

export type ObjectiveFormData = z.infer<ReturnType<typeof createObjectiveFormSchema>>
export type ObjectiveModalFormData = z.infer<ReturnType<typeof createObjectiveModalSchema>>
