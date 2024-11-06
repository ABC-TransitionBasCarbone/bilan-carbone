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
  co2f: z.array(z.number().min(0, 'co2f')).optional(),
  ch4f: z.array(z.number().min(0, 'ch4f')).optional(),
  ch4b: z.array(z.number().min(0, 'ch4b')).optional(),
  n2o: z.array(z.number().min(0, 'n2o')).optional(),
  co2b: z.array(z.number().min(0, 'co2b')).optional(),
  sf6: z.array(z.number().min(0, 'sf6')).optional(),
  hfc: z.array(z.number().min(0, 'hfc')).optional(),
  pfc: z.array(z.number().min(0, 'pfc')).optional(),
  otherGES: z.array(z.number().min(0, 'otherGES')).optional(),
  attribute: z.string().optional(),
  subPost: z.nativeEnum(SubPost, { required_error: 'subPost' }),
  comment: z.string().optional(),
  posts: z
    .array(
      z.object({
        name: z.string({ required_error: 'name' }).trim().min(1, 'name').max(64, 'name-maxlength'),
        type: z.string({ required_error: 'type' }).trim().min(1, 'type').max(64, 'type-maxlength'),
        totalCo2: z
          .number({ invalid_type_error: 'totalCo2', required_error: 'totalCo2' })
          .min(0, 'totalCo2')
          .optional(),
      }),
    )
    .optional(),
})

export type CreateEmissionCommand = z.infer<typeof CreateEmissionCommandValidation>
