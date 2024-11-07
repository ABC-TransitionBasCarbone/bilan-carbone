import { SubPost } from '@prisma/client'
import z from 'zod'

export const CreateEmissionSourceCommandValidation = z.object({
  name: z.string().trim().min(1, 'name'),
  subPost: z.nativeEnum(SubPost),
  studyId: z.string(),
})

export type CreateEmissionSourceCommand = z.infer<typeof CreateEmissionSourceCommandValidation>
