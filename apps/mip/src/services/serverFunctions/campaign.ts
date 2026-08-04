'use server'

import { updateCampaign, updateModelCampaign } from '@/db/campaign'
import { UpdateModelCampaignCommand } from '@/services/serverFunctions/modelCampaign.command'
import { withServerResponse } from '@/utils/serverResponse'
import { isAdmin } from '@/utils/user'
import { Role } from '@abc-transitionbascarbone/db-common/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/services/permissions/check'
import { auth } from '../auth'
import { UpdateCampaignCommand } from './campaign.command'

export const updateModelCampaignCommand = async (command: UpdateModelCampaignCommand) =>
  withServerResponse('updateModelCampaignCommand', async () => {
    const session = await auth()
    if (!session || session.user.role !== Role.SUPER_ADMIN) {
      throw new Error(NOT_AUTHORIZED)
    }
    await updateModelCampaign(command)
  })

export const updateCampaignCommand = async (command: UpdateCampaignCommand) =>
  withServerResponse('updateCampaignCommand', async () => {
    const session = await auth()
    if (!session) {
      throw new Error(NOT_AUTHORIZED)
    }

    const hasUnauthorizedCampaigns =
      !isAdmin(session.user.role) &&
      command.campaigns.some(
        (campaign) => !campaign.allowedAccounts.some((accountId) => accountId === session.user.accountMipId),
      )
    if (hasUnauthorizedCampaigns) {
      throw new Error(NOT_AUTHORIZED)
    }

    await updateCampaign(
      command,
      session.user.accountMipId,
      session.user.organizationVersionMipId,
      isAdmin(session.user.role),
    )
  })
