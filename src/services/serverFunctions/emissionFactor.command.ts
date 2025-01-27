import { EmissionFactorPartType, SubPost, Unit } from '@prisma/client'
import z from 'zod'

export const maxParts = 5

const GESschema = z.object({
  co2f: z.nan().or(z.number().min(0, 'co2f')).optional(),
  ch4f: z.nan().or(z.number().min(0, 'ch4f')).optional(),
  ch4b: z.nan().or(z.number().min(0, 'ch4b')).optional(),
  n2o: z.nan().or(z.number().min(0, 'n2o')).optional(),
  co2b: z.nan().or(z.number().min(0, 'co2b')).optional(),
  sf6: z.nan().or(z.number().min(0, 'sf6')).optional(),
  hfc: z.nan().or(z.number().min(0, 'hfc')).optional(),
  pfc: z.nan().or(z.number().min(0, 'pfc')).optional(),
  otherGES: z.nan().or(z.number().min(0, 'otherGES')).optional(),
})

export const CreateEmissionFactorCommandValidation = z.intersection(
  GESschema,
  z.object({
    name: z
      .string({
        required_error: 'name',
      })
      .trim()
      .min(1, 'name'),
    unit: z.nativeEnum(Unit, { required_error: 'unit' }),
    source: z
      .string({
        required_error: 'source',
      })
      .trim()
      .min(1, 'source'),
    totalCo2: z
      .number({
        invalid_type_error: 'totalCo2',
        required_error: 'totalCo2',
      })
      .min(0, 'totalCo2'),
    attribute: z.string().optional(),
    subPost: z.nativeEnum(SubPost, { required_error: 'subPost' }),
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
)

export type CreateEmissionFactorCommand = z.infer<typeof CreateEmissionFactorCommandValidation>
