import { CampaignStatus } from '@abc-transitionbascarbone/db-common/enums'
import z from 'zod'

export const UpdateCampaignCommandValidation = z.object({
  campaigns: z.array(
    z.object({
      id: z.string(),
      name: z.string().trim().min(1),
      status: z.enum(CampaignStatus),
      allowedAccounts: z.array(z.string()),
      createdBy: z.string(),
      modelCampaignId: z.string(),
    }),
  ),
})

export type UpdateCampaignCommand = z.infer<typeof UpdateCampaignCommandValidation>
