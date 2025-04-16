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
  subPosts: z.record(z.array(z.nativeEnum(SubPost)).min(1), { required_error: 'type' }).superRefine((val, ctx) => {
    if (Object.keys(val).length === 0) {
      ctx.addIssue({ message: 'type', code: z.ZodIssueCode.custom })
      return false
    }

    if (Object.values(val).some((arr) => arr.length === 0)) {
      ctx.addIssue({ message: 'subPost', code: z.ZodIssueCode.custom })
      return false
    }
  }),
})
export type SubPostsCommand = z.infer<typeof SubPostsCommandValidation>

export const EmissionFactorCommandValidation = z.intersection(
  GESschema,
  z.intersection(
    z.object({
      name: z.string({ required_error: 'name' }).trim().min(1, 'name'),
      unit: z.nativeEnum(Unit, { required_error: 'unit' }),
      source: z.string({ required_error: 'source' }).trim().min(1, 'source'),
      totalCo2: z.number({ invalid_type_error: 'totalCo2', required_error: 'totalCo2' }).min(0, 'totalCo2'),
      reliability: z.number({ required_error: 'reliability' }),
      technicalRepresentativeness: z.number({ required_error: 'technicalRepresentativeness' }),
      geographicRepresentativeness: z.number({ required_error: 'geographicRepresentativeness' }),
      temporalRepresentativeness: z.number({ required_error: 'temporalRepresentativeness' }),
      completeness: z.number({ required_error: 'completeness' }),
      attribute: z.string().optional(),
      comment: z.string().optional(),
      parts: z
        .array(
          z.intersection(
            GESschema,
            z.object({
              name: z.string({ required_error: 'name' }).trim().min(1, 'name').max(64, 'nameMaxLength'),
              type: z.nativeEnum(EmissionFactorPartType, { required_error: 'type' }),
              totalCo2: z.number({ invalid_type_error: 'totalCo2', required_error: 'totalCo2' }).min(0, 'totalCo2'),
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
