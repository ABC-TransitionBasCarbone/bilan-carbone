import { setCustomIssue } from '@/lib/zod.config'
import { EmissionFactorPartType, SubPost, Unit } from '@prisma/client'
import z from 'zod'

export const maxParts = 5

const GESschema = z.object({
  co2f: z.nan().or(z.number().min(0)).optional(),
  ch4f: z.nan().or(z.number().min(0)).optional(),
  ch4b: z.nan().or(z.number().min(0)).optional(),
  n2o: z.nan().or(z.number().min(0)).optional(),
  co2b: z.nan().or(z.number()).optional(),
  sf6: z.nan().or(z.number().min(0)).optional(),
  hfc: z.nan().or(z.number().min(0)).optional(),
  pfc: z.nan().or(z.number().min(0)).optional(),
  otherGES: z.nan().or(z.number().min(0)).optional(),
})

export const SubPostsCommandValidation = (allowEmptySubPosts: boolean) =>
  z.object({
    subPosts: z.record(z.string(), z.array(z.enum(SubPost))).superRefine((val, ctx) => {
      const entries = Object.entries(val)

      if (!allowEmptySubPosts && entries.length === 0) {
        ctx.addIssue(setCustomIssue(['subPosts'], 'subPostRequired'))
        return
      }

      if (entries.some(([, arr]) => arr.length === 0)) {
        ctx.addIssue(setCustomIssue(['subPosts'], 'subPostRequired'))
      }
    }),
  })

export type SubPostsCommand = z.infer<ReturnType<typeof SubPostsCommandValidation>>

export const EmissionFactorCommandValidation = z.intersection(
  GESschema,
  z.intersection(
    z.object({
      name: z.string().trim().min(1),
      unit: z.enum(Unit),
      customUnit: z.string().nullable().optional(),
      isMonetary: z.boolean(),
      source: z.string().trim().min(1),
      location: z.string().trim().optional(),
      totalCo2: z.number().min(0),
      reliability: z.number(),
      technicalRepresentativeness: z.number(),
      geographicRepresentativeness: z.number(),
      temporalRepresentativeness: z.number(),
      completeness: z.number(),
      attribute: z.string().optional(),
      comment: z.string().optional(),
      parts: z
        .array(
          z.intersection(
            GESschema,
            z.object({
              name: z.string().trim().min(1).max(64),
              type: z.enum(EmissionFactorPartType),
              totalCo2: z.number().min(0),
            }),
          ),
        )
        .max(maxParts),
    }),
    SubPostsCommandValidation(false),
  ),
)

export type EmissionFactorCommand = z.infer<typeof EmissionFactorCommandValidation>

export const UpdateEmissionFactorCommandValidation = z.intersection(
  z.object({
    id: z.string(),
  }),
  EmissionFactorCommandValidation,
)

export type UpdateEmissionFactorCommand = z.infer<typeof UpdateEmissionFactorCommandValidation>
