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

export const UpdateOrganizationCommandValidation = z.intersection(
  CreateOrganizationCommandValidation,
  z.object({
    organizationId: z.string(),
    sites: z.array(
      z.object({
        id: z.string(),
        name: z
          .string({
            required_error: 'name',
          })
          .trim()
          .min(1, 'name'),
        etp: z.number({ required_error: 'etp', invalid_type_error: 'etp' }).int('etp').min(0, { message: 'etp' }),
        ca: z.number({ required_error: 'ca', invalid_type_error: 'ca' }).min(0, { message: 'ca' }),
      }),
    ),
  }),
)

export type UpdateOrganizationCommand = z.infer<typeof UpdateOrganizationCommandValidation>
