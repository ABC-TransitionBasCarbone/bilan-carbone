'use server'

import { getAccountMipFromUserOrganization } from '@/db/accountMip'
import { getAllOrganizationVersionMipCampaigns, updateCampaign, updateModelCampaign } from '@/db/campaign'
import { getOrgNameByOrgVersionMipId } from '@/db/organization'
import { UpdateModelCampaignCommand } from '@/services/serverFunctions/modelCampaign.command'
import { withServerResponse } from '@/utils/serverResponse'
import { isAdmin } from '@/utils/user'
import { Role } from '@abc-transitionbascarbone/db-common/enums'
import { sendCampaignCreatedByCollaboratorEmail } from '@abc-transitionbascarbone/services/email/email'
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

    const userIsAdmin = isAdmin(session.user.role)

    const hasUnauthorizedCampaigns =
      !userIsAdmin &&
      command.campaigns.some(
        (campaign) => !campaign.allowedAccounts.some((accountId) => accountId === session.user.accountMipId),
      )
    if (hasUnauthorizedCampaigns) {
      throw new Error(NOT_AUTHORIZED)
    }

    let createdCampaignNames: string[] = []
    if (!userIsAdmin) {
      const organizationCampaigns = await getAllOrganizationVersionMipCampaigns(session.user.organizationVersionMipId)
      const organizationCampaignIds = new Set(organizationCampaigns.map((campaign) => campaign.id))
      createdCampaignNames = command.campaigns
        .filter((campaign) => !organizationCampaignIds.has(campaign.id))
        .map((campaign) => campaign.name)
    }

    await updateCampaign(command, session.user.accountMipId, session.user.organizationVersionMipId, userIsAdmin)

    if (!userIsAdmin && createdCampaignNames.length > 0) {
      const organizationName = await getOrgNameByOrgVersionMipId(session.user.organizationVersionMipId)
      const organizationMembers = await getAccountMipFromUserOrganization(session.user)
      const adminEmails = Array.from(
        new Set(
          organizationMembers.filter((member) => isAdmin(member.role)).map((member) => member.user.email.toLowerCase()),
        ),
      )

      if (adminEmails.length > 0) {
        const creatorName = `${session.user.firstName} ${session.user.lastName}`.trim() || session.user.email
        try {
          await sendCampaignCreatedByCollaboratorEmail(
            adminEmails,
            creatorName,
            createdCampaignNames,
            organizationName || '',
          )
        } catch (error) {
          console.error('updateCampaignCommand: failed to notify admins', {
            accountMipId: session.user.accountMipId,
            organizationVersionMipId: session.user.organizationVersionMipId,
            createdCampaignNames,
            error,
          })
        }
      }
    }
  })
