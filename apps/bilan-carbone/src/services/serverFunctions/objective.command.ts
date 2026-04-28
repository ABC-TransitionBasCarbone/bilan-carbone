import { setCustomIssue } from '@repo/lib'
import { SubPost } from '@repo/db-common/enums'
import { z } from 'zod'

export const createObjectiveFormSchema = ({ referenceYear }: { referenceYear?: number } = {}) =>
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
      if (referenceYear !== undefined && startYear < referenceYear) {
        ctx.addIssue(setCustomIssue(['startYear'], 'yearMustBeAfterReferenceYear'))
      }
      if (referenceYear !== undefined && targetYear <= referenceYear) {
        ctx.addIssue(setCustomIssue(['targetYear'], 'yearMustBeAfterReferenceYear'))
      }
    })

export const createObjectiveModalSchema = ({
  hasTagFamilies = true,
  referenceYear,
}: { hasTagFamilies?: boolean; referenceYear?: number } = {}) => {
  const objectiveFormSchema = createObjectiveFormSchema({ referenceYear })
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
