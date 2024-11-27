import z from 'zod'

export const CreateOrganizationCommandValidation = z.object({
  name: z
    .string({
      required_error: 'name',
    })
    .trim()
    .min(1, 'name'),
})

export type CreateOrganizationCommand = z.infer<typeof CreateOrganizationCommandValidation>

export const UpdateOrganizationCommandValidation = z.object({
  organizationId: z.string(),
  name: z
    .string({
      required_error: 'name',
    })
    .optional(),
})

export type UpdateOrganizationCommand = z.infer<typeof UpdateOrganizationCommandValidation>
