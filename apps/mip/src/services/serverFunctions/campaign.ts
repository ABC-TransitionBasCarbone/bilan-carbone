'use server'

import { updateModelCampaign } from '@/db/campaign'
import { UpdateModelCampaignCommand } from '@/services/serverFunctions/modelCampaign.command'
import { withServerResponse } from '@/utils/serverResponse'
import { Role } from '@abc-transitionbascarbone/db-common/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/services/permissions/check'
import { auth } from '../auth'

export const updateModelCampaignCommand = async (command: UpdateModelCampaignCommand) =>
  withServerResponse('updateModelCampaignCommand', async () => {
    const session = await auth()
    if (!session || session.user.role !== Role.SUPER_ADMIN) {
      throw new Error(NOT_AUTHORIZED)
    }
    await updateModelCampaign(command)
  })
