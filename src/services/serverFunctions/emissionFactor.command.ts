import { EmissionFactorPartType, SubPost, Unit } from '@prisma/client'
import z from 'zod'

export const maxParts = 5

const GESschema = z.object({
  co2f: z.nan().or(z.number().min(0, 'co2f')).optional(),
  ch4f: z.nan().or(z.number().min(0, 'ch4f')).optional(),
  ch4b: z.nan().or(z.number().min(0, 'ch4b')).optional(),
  n2o: z.nan().or(z.number().min(0, 'n2o')).optional(),
  co2b: z.nan().or(z.number()).optional(),
  sf6: z.nan().or(z.number().min(0, 'sf6')).optional(),
  hfc: z.nan().or(z.number().min(0, 'hfc')).optional(),
  pfc: z.nan().or(z.number().min(0, 'pfc')).optional(),
  otherGES: z.nan().or(z.number().min(0, 'otherGES')).optional(),
})

export const SubPostsCommandValidation = z.object({
  subPosts: z
    .record(z.string(), z.array(z.enum(SubPost)).min(1), {
      error: 'type',
    })
    .superRefine((val, ctx) => {
      if (Object.keys(val).length === 0) {
        ctx.addIssue({ message: 'type', code: 'custom' })
        return
      }

      if (Object.values(val).some((arr) => arr.length === 0)) {
        ctx.addIssue({ message: 'subPost', code: 'custom' })
      }
    }),
})
export type SubPostsCommand = z.infer<typeof SubPostsCommandValidation>

export const EmissionFactorCommandValidation = z.intersection(
  GESschema,
  z.intersection(
    z.object({
      name: z
        .string({
          error: (issue) => (issue.input === undefined ? 'name' : undefined),
        })
        .trim()
        .min(1, 'name'),
      unit: z.enum(Unit, {
        error: (issue) => (issue.input === undefined ? 'unit' : undefined),
      }),
      customUnit: z.string().nullable().optional(),
      isMonetary: z.boolean(),
      source: z
        .string({
          error: (issue) => (issue.input === undefined ? 'source' : undefined),
        })
        .trim()
        .min(1, 'source'),
      totalCo2: z
        .number({
          error: (issue) => (issue.input === undefined ? 'totalCo2' : 'totalCo2'),
        })
        .min(0, 'totalCo2'),
      reliability: z.number({
        error: (issue) => (issue.input === undefined ? 'required' : undefined),
      }),
      technicalRepresentativeness: z.number({
        error: (issue) => (issue.input === undefined ? 'required' : undefined),
      }),
      geographicRepresentativeness: z.number({
        error: (issue) => (issue.input === undefined ? 'required' : undefined),
      }),
      temporalRepresentativeness: z.number({
        error: (issue) => (issue.input === undefined ? 'required' : undefined),
      }),
      completeness: z.number({
        error: (issue) => (issue.input === undefined ? 'required' : undefined),
      }),
      attribute: z.string().optional(),
      comment: z.string().optional(),
      parts: z
        .array(
          z.intersection(
            GESschema,
            z.object({
              name: z
                .string({
                  error: (issue) => (issue.input === undefined ? 'name' : undefined),
                })
                .trim()
                .min(1, 'name')
                .max(64, 'nameMaxLength'),
              type: z.enum(EmissionFactorPartType, {
                error: (issue) => (issue.input === undefined ? 'type' : undefined),
              }),
              totalCo2: z
                .number({
                  error: (issue) => (issue.input === undefined ? 'totalCo2' : 'totalCo2'),
                })
                .min(0, 'totalCo2'),
            }),
          ),
        )
        .max(maxParts),
    }),
    SubPostsCommandValidation,
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
