import { SubPost, Unit } from '@prisma/client'
import z from 'zod'

export const CreateEmissionCommandValidation = z.object({
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
  co2f: z.number().min(0, 'co2f').optional(),
  ch4f: z.number().min(0, 'ch4f').optional(),
  ch4b: z.number().min(0, 'ch4b').optional(),
  n2o: z.number().min(0, 'n2o').optional(),
  co2b: z.number().min(0, 'co2b').optional(),
  sf6: z.number().min(0, 'sf6').optional(),
  hfc: z.number().min(0, 'hfc').optional(),
  pfc: z.number().min(0, 'pfc').optional(),
  otherGES: z.number().min(0, 'otherGES').optional(),
  attribute: z.string().optional(),
  subPost: z.nativeEnum(SubPost, { required_error: 'subPost' }),
  comment: z.string().optional(),
})

export type CreateEmissionCommand = z.infer<typeof CreateEmissionCommandValidation>
