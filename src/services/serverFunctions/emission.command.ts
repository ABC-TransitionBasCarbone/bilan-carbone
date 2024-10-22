import z from 'zod'

export const CreateEmissionCommandValidation = z.object({
  name: z
    .string({
      required_error: 'name',
    })
    .trim()
    .min(1, 'name'),
  unit: z
    .string({
      required_error: 'unit',
    })
    .trim()
    .min(1, 'unit'),
  source: z
    .string({
      required_error: 'source',
    })
    .trim()
    .min(1, 'source'),
  totalCo2: z
    .number({
      required_error: 'totalCo2',
    })
    .min(0, 'totalCo2'),
  co2f: z.number().min(0, 'co2f').optional(),
  ch4f: z.number().min(0, 'ch4f').optional(),
  ch4b: z.number().min(0, 'ch4b').optional(),
  n2o: z.number().min(0, 'n2o').optional(),
  co2b: z.number().min(0, 'co2b').optional(),
  otherGES: z.number().min(0, 'otherGES').optional(),
})

export type CreateEmissionCommand = z.infer<typeof CreateEmissionCommandValidation>
