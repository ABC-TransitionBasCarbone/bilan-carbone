'use server'

import { prismaClient } from '@/db/client'
import { getCourseSessionForProfessor } from '@/db/courseSession'
import { getStudiesForCorrectionSharing, getStudyById, getStudyForNavbar } from '@/db/study'
import { getCorrectionDeliverySession, recordCorrectionDelivery } from '@/db/studyCorrectionDelivery'
import { canShareStudyCorrection } from '@/services/permissions/study.utils'
import {
  getCorrectionTargets,
  getCorrectionTargetSnapshot,
  type CorrectionRecipient,
} from '@/services/studyCorrectionSharing'
import { addPlanToStudyCorrection, copyStudyCorrection } from '@/services/trainingCorrection'
import { withServerResponse } from '@/utils/serverResponse'
import { getAccountRoleOnStudy } from '@/utils/study'
import { accountWithUserToUserSession } from '@/utils/userAccounts'
import type { Prisma } from '@abc-transitionbascarbone/common/db'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import type { UserSession } from 'next-auth'
import { getAuthenticatedAccountWithOrga } from '../auth'
import {
  CorrectionSharingSelectionValidation,
  RecordCorrectionSharingValidation,
  type CorrectionSharingSelection,
  type RecordCorrectionSharingCommand,
} from './studyCorrectionSharing.command'

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

  return { preview: { name: session.name, recipients, hasTransitionPlan: !!study.transitionPlan }, deliveries }
}

export const previewCorrectionSharing = async (input: CorrectionSharingSelection) =>
  withServerResponse('previewCorrectionSharing', async () => {
    const selection = CorrectionSharingSelectionValidation.parse(input)
    const account = await getAuthenticatedAccountWithOrga()
    const { preview } = await getCorrectionSharingPreview(
      prismaClient,
      accountWithUserToUserSession(account),
      selection,
    )
    return preview
  })

export const getCorrectionStudiesForSession = async (input: string) =>
  withServerResponse('getCorrectionStudiesForSession', async () => {
    const courseSessionId = CorrectionSharingSelectionValidation.shape.courseSessionId.parse(input)
    const account = await getAuthenticatedAccountWithOrga()
    const session = await getCourseSessionForProfessor(
      account.organizationVersionId,
      account.environment,
      courseSessionId,
      false,
    )
    if (!session) {
      console.error('getCorrectionStudiesForSession: session not authorized or ineligible', {
        courseSessionId,
        accountId: account.id,
      })
      throw new Error(NOT_AUTHORIZED)
    }

    const user = accountWithUserToUserSession(account)
    const studies = await getStudiesForCorrectionSharing(user)
    return studies
      .filter((study) => canShareStudyCorrection(user, study) && getAccountRoleOnStudy(user, study))
      .map(({ id, name }) => ({ id, name }))
  })

export const recordCorrectionSharing = async (input: RecordCorrectionSharingCommand) =>
  withServerResponse('recordCorrectionSharing', async () => {
    const command = RecordCorrectionSharingValidation.parse(input)
    const trainerAuthenticatedAccount = await getAuthenticatedAccountWithOrga()
    const user = accountWithUserToUserSession(trainerAuthenticatedAccount)
    return prismaClient.$transaction(
      async (tx) => {
        const { preview, deliveries } = await getCorrectionSharingPreview(tx, user, command)
        const targets = getCorrectionTargets(preview.recipients, command.includePlan)
        if (
          (command.includePlan && !preview.hasTransitionPlan) ||
          command.confirmationName.trim() !== preview.name.trim() ||
          command.targetSnapshot !== getCorrectionTargetSnapshot(targets) ||
          targets.length === 0
        ) {
          return { status: 'changed' as const, preview }
        }

        const source = await getStudyById(command.studyId, trainerAuthenticatedAccount.organizationVersionId, tx)
        if (!source) {
          throw new Error(`Correction study ${command.studyId} not found`)
        }
        const accountsByOrganization = new Map<string, string[]>()
        for (const { id, organizationVersionId } of targets) {
          const accountIds = accountsByOrganization.get(organizationVersionId)
          if (accountIds) {
            accountIds.push(id)
          } else {
            accountsByOrganization.set(organizationVersionId, [id])
          }
        }
        for (const [organizationVersionId, accountIds] of accountsByOrganization) {
          const delivery = deliveries.get(organizationVersionId)
          let copiedStudyId: string
          if (delivery) {
            copiedStudyId = delivery.copiedStudyId
            await addPlanToStudyCorrection(tx, source, copiedStudyId, organizationVersionId)
          } else {
            const copy = await copyStudyCorrection(
              tx,
              source,
              preview.name,
              { accountId: trainerAuthenticatedAccount.id, environment: trainerAuthenticatedAccount.environment },
              organizationVersionId,
              accountIds,
              command.includePlan,
            )
            copiedStudyId = copy.id
          }
          await recordCorrectionDelivery(
            tx,
            source.id,
            command.courseSessionId,
            organizationVersionId,
            copiedStudyId,
            command.includePlan,
          )
        }
        return { status: 'recorded' as const }
      },
      { isolationLevel: 'Serializable', timeout: 60_000 },
    )
  })
