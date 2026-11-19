'use server'

import { prismaClient } from '@/db/client'
import { getCourseSessionForProfessor } from '@/db/courseSession'
import { getStudiesForCorrectionSharing, getStudyForNavbar } from '@/db/study'
import { getCorrectionDeliverySession, recordCorrectionDelivery } from '@/db/studyCorrectionDelivery'
import { canShareStudyCorrection } from '@/services/permissions/study.utils'
import {
  getCorrectionTargets,
  getCorrectionTargetSnapshot,
  type CorrectionRecipient,
} from '@/services/studyCorrectionSharing'
import { withServerResponse } from '@/utils/serverResponse'
import { getAccountRoleOnStudy } from '@/utils/study'
import type { Prisma } from '@abc-transitionbascarbone/common/db'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import type { UserSession } from 'next-auth'
import { dbActualizedAuth } from '../auth'
import {
  CorrectionSharingSelectionValidation,
  RecordCorrectionSharingValidation,
  type CorrectionSharingSelection,
  type RecordCorrectionSharingCommand,
} from './studyCorrectionSharing.command'

const getCorrectionSharingAccount = async () => {
  const account = (await dbActualizedAuth())?.user
  const organizationVersionId = account?.organizationVersionId
  if (!account || !organizationVersionId) {
    console.error('getCorrectionSharingAccount: user not authorized', { accountId: account?.accountId })
    throw new Error(NOT_AUTHORIZED)
  }
  return { ...account, organizationVersionId }
}

const getCorrectionSharingPreview = async (
  tx: Prisma.TransactionClient,
  account: UserSession,
  { studyId, courseSessionId }: CorrectionSharingSelection,
) => {
  const study = await getStudyForNavbar(studyId, tx)
  if (!study || !canShareStudyCorrection(account, study) || !getAccountRoleOnStudy(account, study)) {
    console.error('getCorrectionSharingPreview: study not authorized', { studyId, accountId: account.accountId })
    throw new Error(NOT_AUTHORIZED)
  }

  const session = await getCorrectionDeliverySession(tx, account, studyId, courseSessionId)
  if (!session) {
    console.error('getCorrectionSharingPreview: session not authorized or ineligible', {
      courseSessionId,
      accountId: account.accountId,
    })
    throw new Error(NOT_AUTHORIZED)
  }

  const deliveries = new Map(
    session.correctionDeliveries.map((delivery) => [delivery.recipientOrganizationVersionId, delivery]),
  )
  const recipients = session.traineeOrganizations
    .flatMap(({ organizationVersionId, organizationVersion }): CorrectionRecipient[] => {
      const delivery = deliveries.get(organizationVersionId)
      const status = !delivery ? 'notSent' : delivery.transitionPlanSentAt ? 'withPlan' : 'withoutPlan'
      return organizationVersion.userAccounts.map(({ id, user }) => ({ id, organizationVersionId, ...user, status }))
    })
    .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))

  return { name: session.name, recipients }
}

export const previewCorrectionSharing = async (input: CorrectionSharingSelection) =>
  withServerResponse('previewCorrectionSharing', async () => {
    const selection = CorrectionSharingSelectionValidation.parse(input)
    return getCorrectionSharingPreview(prismaClient, await getCorrectionSharingAccount(), selection)
  })

export const getCorrectionStudiesForSession = async (input: string) =>
  withServerResponse('getCorrectionStudiesForSession', async () => {
    const courseSessionId = CorrectionSharingSelectionValidation.shape.courseSessionId.parse(input)
    const account = await getCorrectionSharingAccount()
    const session = await getCourseSessionForProfessor(
      account.organizationVersionId,
      account.environment,
      courseSessionId,
      new Date(),
    )
    if (!session) {
      console.error('getCorrectionStudiesForSession: session not authorized or ineligible', {
        courseSessionId,
        accountId: account.accountId,
      })
      throw new Error(NOT_AUTHORIZED)
    }

    const studies = await getStudiesForCorrectionSharing(account)
    return studies
      .filter((study) => canShareStudyCorrection(account, study) && getAccountRoleOnStudy(account, study))
      .map(({ id, name }) => ({ id, name }))
  })

export const recordCorrectionSharing = async (input: RecordCorrectionSharingCommand) =>
  withServerResponse('recordCorrectionSharing', async () => {
    const command = RecordCorrectionSharingValidation.parse(input)
    const account = await getCorrectionSharingAccount()
    return prismaClient.$transaction(
      async (tx) => {
        const preview = await getCorrectionSharingPreview(tx, account, command)
        const targets = getCorrectionTargets(preview.recipients, command.includePlan)
        if (
          command.confirmationName.trim() !== preview.name.trim() ||
          command.targetSnapshot !== getCorrectionTargetSnapshot(targets) ||
          targets.length === 0
        ) {
          return { status: 'changed' as const, preview }
        }

        await recordCorrectionDelivery(tx, command.studyId, command.courseSessionId, targets, command.includePlan)
        return { status: 'recorded' as const }
      },
      { isolationLevel: 'Serializable' },
    )
  })
