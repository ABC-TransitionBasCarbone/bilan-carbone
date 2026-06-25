import z from 'zod'

export const UpdateModelCampaignCommandValidation = z.object({
  modelCampaigns: z.array(
    z.object({
      id: z.string(),
      name: z.string().trim().min(1),
      model: z.any(),
      organizationVersionMip: z
        .object({
          id: z.string(),
          name: z.string(),
        })
        .nullable(),
    }),
  ),
})

export type UpdateModelCampaignCommand = z.infer<typeof UpdateModelCampaignCommandValidation>
