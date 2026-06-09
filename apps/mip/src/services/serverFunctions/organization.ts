'use server'

import { withServerResponse } from '@/utils/serverResponse'


export const deleteOrganizationMember = async (email: string) =>
  withServerResponse('deleteOrganizationMember', async () => {
    // const session = await dbActualizedAuth()
  //   if (!session || !(await canDeleteMember(email))) {
  //     throw new Error(NOT_AUTHORIZED)
  //   }

  //   const targetMember = await getUserByEmail(email)

  //   const targetMemberAccount = targetMember?.accounts.find(
  //     (account) => account.organizationVersionId === session.user.organizationVersionId,
  //   )

  //   if (!targetMemberAccount || !targetMemberAccount.organizationVersionId) {
  //     throw new Error(NOT_AUTHORIZED)
  //   }
  //   const organizationVersions = await getAccountOrganizationVersions(targetMemberAccount.id)

  //   const blockingStudies = await getStudiesWithOnlyValidator(email, targetMemberAccount, organizationVersions)
  //   if (blockingStudies.length) {
  //     return {
  //       code: 'necessaryAdmin',
  //       studies: blockingStudies,
  //     }
  //   }

  //   await deleteStudyMemberFromOrganization(
  //     targetMemberAccount.id,
  //     organizationVersions.map((organizationVersion) => organizationVersion.id),
  //   )
  //   await updateAccount(targetMemberAccount.id, { organizationVersion: { disconnect: true } }, {})
  //   return null
  })
