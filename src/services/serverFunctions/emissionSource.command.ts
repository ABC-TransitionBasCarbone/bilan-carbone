import { EmissionSourceType, SubPost } from '@prisma/client'
import z from 'zod'

export const CreateEmissionSourceCommandValidation = z.object({
  name: z.string().trim().min(1, 'name'),
  subPost: z.nativeEnum(SubPost),
  studyId: z.string(),
})

export type CreateEmissionSourceCommand = z.infer<typeof CreateEmissionSourceCommandValidation>

export const UpdateEmissionSourceCommandValidation = z.object({
  emissionSourceId: z.string(),
  name: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  emissionId: z.string().trim().optional(),
  caracterisation: z.string().trim().optional(),
  value: z.number().optional(),
  source: z.string().trim().optional(),
  type: z.nativeEnum(EmissionSourceType).optional(),
  reliability: z.number().optional(),
  technicalRepresentativeness: z.number().optional(),
  geographicRepresentativeness: z.number().optional(),
  temporalRepresentativeness: z.number().optional(),
  completeness: z.number().optional(),
  comment: z.string().trim().optional(),
  validated: z.boolean().optional(),
})
export type UpdateEmissionSourceCommand = z.infer<typeof UpdateEmissionSourceCommandValidation>
