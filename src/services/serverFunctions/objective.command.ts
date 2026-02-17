import { setCustomIssue } from '@/lib/zod.config'
import { SubPost } from '@prisma/client'
import { z } from 'zod'

export const createObjectiveFormSchema = () =>
  z
    .object({
      startYear: z.string(),
      targetYear: z.string(),
      reductionRate: z.number(),
    })
    .refine(
      (data) => {
        if (!data.targetYear || !data.startYear) {
          return true
        }
        const startYear = parseInt(data.startYear, 10)
        const targetYear = parseInt(data.targetYear, 10)
        return startYear < targetYear
      },
      setCustomIssue(['startYear'], 'startYearMustBeBeforeTargetYear'),
    )

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
