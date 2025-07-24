import { EmissionSourceCaracterisation, EmissionSourceType, SubPost } from '@prisma/client'
import z from 'zod'

export const CreateEmissionSourceCommandValidation = z.object({
  name: z.string().trim().min(1, 'name'),
  subPost: z.nativeEnum(SubPost),
  studyId: z.string(),
  studySiteId: z.string(),
  caracterisation: z.nativeEnum(EmissionSourceCaracterisation).optional(),
  emissionFactorId: z.string().nullable().optional(),
  value: z.number().optional(),
  type: z.nativeEnum(EmissionSourceType).optional().nullable(),
  depreciationPeriod: z.number().optional(),
})

export type CreateEmissionSourceCommand = z.infer<typeof CreateEmissionSourceCommandValidation>

export const UpdateEmissionSourceCommandValidation = z.object({
  emissionSourceId: z.string(),
  name: z.string().trim().optional(),
  emissionFactorId: z.string().trim().optional().nullable(),
  caracterisation: z.nativeEnum(EmissionSourceCaracterisation).optional().nullable(),
  value: z.number().optional(),
  source: z.string().trim().optional(),
  type: z.nativeEnum(EmissionSourceType).optional().nullable(),
  reliability: z.number().optional(),
  technicalRepresentativeness: z.number().optional(),
  geographicRepresentativeness: z.number().optional(),
  temporalRepresentativeness: z.number().optional(),
  completeness: z.number().optional(),
  comment: z.string().trim().optional(),
  validated: z.boolean().optional(),
  depreciationPeriod: z.number().optional(),
  hectare: z.number().optional(),
  duration: z.number().optional(),
  feReliability: z.number().nullable().optional(),
  feTechnicalRepresentativeness: z.number().nullable().optional(),
  feGeographicRepresentativeness: z.number().nullable().optional(),
  feTemporalRepresentativeness: z.number().nullable().optional(),
  feCompleteness: z.number().nullable().optional(),
  emissionSourceTagId: z.string().optional(),
})
export type UpdateEmissionSourceCommand = z.infer<typeof UpdateEmissionSourceCommandValidation>

export const NewEmissionSourceTagCommandValidation = z.object({
  studyId: z.string(),
  name: z.string(),
})

export type NewEmissionSourceTagCommand = z.infer<typeof NewEmissionSourceTagCommandValidation>
