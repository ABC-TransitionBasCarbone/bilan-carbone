import { EmissionFactorPartType, SubPost, Unit } from '@prisma/client'
import z from 'zod'

export const maxParts = 5

const GESschema = z.object({
  co2f: z.number().min(0, 'co2f').default(0),
  ch4f: z.number().min(0, 'ch4f').default(0),
  ch4b: z.number().min(0, 'ch4b').default(0),
  n2o: z.number().min(0, 'n2o').default(0),
  co2b: z.number().min(0, 'co2b').default(0),
  sf6: z.number().min(0, 'sf6').default(0),
  hfc: z.number().min(0, 'hfc').default(0),
  pfc: z.number().min(0, 'pfc').default(0),
  otherGES: z.number().min(0, 'otherGES').default(0),
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

export const UpdateEmissionFactorCommandValidation = z.intersection(
  z.object({
    id: z.string(),
  }),
  CreateEmissionFactorCommandValidation,
)

export type UpdateEmissionFactorCommand = z.infer<typeof UpdateEmissionFactorCommandValidation>
