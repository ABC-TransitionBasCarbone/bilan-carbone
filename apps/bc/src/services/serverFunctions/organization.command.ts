import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import z from 'zod'
import { SitesCommandValidation } from './study.command'

export const CreateOrganizationCommandValidation = z.object({
  name: z.string().trim().min(1),
  siret: z.string().trim(),
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

export const canUpdateOrganizationSiret = (environment: Environment, parentId: string | null) =>
  environment !== Environment.BC || !!parentId
