import z from 'zod'
import { SitesCommandValidation } from './study.command'

export const CreateOrganizationCommandValidation = z.object({
  name: z
    .string({
      required_error: 'name',
    })
    .trim()
    .min(1, 'name'),
})

export type CreateOrganizationCommand = z.infer<typeof CreateOrganizationCommandValidation>

export const UpdateOrganizationCommandValidation = z.intersection(
  CreateOrganizationCommandValidation,
  z.intersection(
    z.object({
      organizationId: z.string(),
    }),
    SitesCommandValidation,
  ),
)

export type UpdateOrganizationCommand = z.infer<typeof UpdateOrganizationCommandValidation>
