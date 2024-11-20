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
