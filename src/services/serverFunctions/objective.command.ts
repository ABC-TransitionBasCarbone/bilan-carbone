import { setCustomIssue } from '@/lib/zod.config'
import { SubPost } from '@prisma/client'
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

export const createObjectiveModalSchema = () => {
  const objectiveFormSchema = createObjectiveFormSchema()
  return z
    .object({
      siteIds: z.array(z.string()),
      tagIds: z.array(z.string()),
      subPosts: z.array(z.enum(SubPost)),
      objectives: z.array(objectiveFormSchema),
    })
    .refine(
      (data) => {
        return data.siteIds.length > 0 || data.tagIds.length > 0 || data.subPosts.length > 0
      },
      setCustomIssue(['siteIds'], 'scopeRequired'),
    )
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
