import z from 'zod'
import { SitesCommandValidation } from './study.command'

export const CreateOrganizationCommandValidation = z.object({
  name: z.string().trim().min(1),
})

export type CreateOrganizationCommand = z.infer<typeof CreateOrganizationCommandValidation>

export const UpdateOrganizationCommandValidation = z.intersection(
  CreateOrganizationCommandValidation,
  z.intersection(
    z.object({
      organizationVersionId: z.string(),
    }),
    SitesCommandValidation,
  ),
)

export type UpdateOrganizationCommand = z.infer<typeof UpdateOrganizationCommandValidation>
