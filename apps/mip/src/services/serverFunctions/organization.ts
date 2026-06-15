'use server'

import { updateAccountMip } from '@/db/accountMip'
import { getUserByEmail } from '@/db/user'
import { withServerResponse } from '@/utils/serverResponse'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/services/permissions/check'
import { dbActualizedAuth } from '../auth'
import { canDeleteMember } from '../permissions/organization'

export const deleteOrganizationMember = async (email: string) =>
  withServerResponse('deleteOrganizationMember', async () => {
    const session = await dbActualizedAuth()
    if (!session || !(await canDeleteMember(email))) {
      throw new Error(NOT_AUTHORIZED)
    }

    const targetMember = await getUserByEmail(email)

    const targetMemberAccountMip = targetMember?.accountsMip.find(
      (accountMip) => accountMip.organizationVersionMipId === session.user.organizationVersionMipId,
    )

    if (!targetMemberAccountMip || !targetMemberAccountMip.organizationVersionMipId) {
      throw new Error(NOT_AUTHORIZED)
    }

    await updateAccountMip(targetMemberAccountMip.id, { organizationVersionMip: { disconnect: true } }, {})
  })
