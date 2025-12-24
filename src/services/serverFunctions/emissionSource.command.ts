import { EmissionSourceCaracterisation, EmissionSourceType, SubPost } from '@prisma/client'
import z from 'zod'

export const CreateEmissionSourceCommandValidation = z.object({
  name: z.string().trim().min(1),
  subPost: z.enum(SubPost),
  studyId: z.string(),
  studySiteId: z.string(),
  caracterisation: z.enum(EmissionSourceCaracterisation).optional(),
  constructionYear: z.date().nullable().optional(),
  emissionFactorId: z.string().nullable().optional(),
  value: z.number().optional(),
  type: z.enum(EmissionSourceType).optional().nullable(),
  depreciationPeriod: z.number().optional(),
})
export type CreateEmissionSourceCommand = z.infer<typeof CreateEmissionSourceCommandValidation>

export const UpdateEmissionSourceCommandValidation = z.object({
  emissionSourceId: z.string(),
  name: z.string().trim().optional(),
  emissionFactorId: z.string().trim().optional().nullable(),
  caracterisation: z.enum(EmissionSourceCaracterisation).optional().nullable(),
  constructionYear: z.date().nullable().optional(),
  value: z.number().optional(),
  source: z.string().trim().optional(),
  type: z.enum(EmissionSourceType).optional().nullable(),
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
  emissionSourceTags: z.array(z.string()).optional(),
})
export type UpdateEmissionSourceCommand = z.infer<typeof UpdateEmissionSourceCommandValidation>

export const NewStudyTagCommandValidation = z.object({
  familyId: z.string(),
  name: z.string(),
  color: z.string(),
})
export type NewStudyTagCommand = z.infer<typeof NewStudyTagCommandValidation>

export const NewStudyTagFamilyCommandValidation = z.object({
  id: z.string().optional(),
  name: z.string(),
})
export type NewStudyTagFamilyCommand = z.infer<typeof NewStudyTagFamilyCommandValidation>
