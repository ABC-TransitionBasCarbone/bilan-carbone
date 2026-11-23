import { correctionShareSessionDates, type CorrectionRecipient } from '@/services/studyCorrectionSharing'
import type { Prisma } from '@abc-transitionbascarbone/common/db'
import type { UserSession } from 'next-auth'

export const getCorrectionDeliverySession = (
  tx: Prisma.TransactionClient,
  user: UserSession,
  studyId: string,
  courseSessionId: string,
) =>
  tx.courseSession.findFirst({
    where: {
      id: courseSessionId,
      professorOrganizationVersionId: user.organizationVersionId,
      environment: user.environment,
      ...correctionShareSessionDates(),
    },
    select: {
      name: true,
      traineeOrganizations: {
        where: { attendance: { isNot: null } },
        select: {
          organizationVersionId: true,
          organizationVersion: {
            select: {
              userAccounts: {
                where: { environment: user.environment },
                select: { id: true, user: { select: { firstName: true, lastName: true } } },
              },
            },
          },
        },
      },
      correctionDeliveries: {
        where: { sourceStudyId: studyId },
        select: { recipientOrganizationVersionId: true, transitionPlanSentAt: true },
      },
    },
  })

export const recordCorrectionDelivery = async (
  tx: Prisma.TransactionClient,
  sourceStudyId: string,
  courseSessionId: string,
  targets: CorrectionRecipient[],
  includePlan: boolean,
) => {
  const missing = new Set(
    targets.filter(({ status }) => status === 'notSent').map(({ organizationVersionId }) => organizationVersionId),
  )
  const transitionPlanSentAt = includePlan ? new Date() : null
  if (missing.size > 0) {
    await tx.studyCorrectionDelivery.createMany({
      data: [...missing].map((recipientOrganizationVersionId) => ({
        sourceStudyId,
        courseSessionId,
        recipientOrganizationVersionId,
        transitionPlanSentAt,
      })),
    })
  }
  if (includePlan) {
    const upgrades = [
      ...new Set(
        targets
          .filter(({ status }) => status === 'withoutPlan')
          .map(({ organizationVersionId }) => organizationVersionId),
      ),
    ]
    if (upgrades.length > 0) {
      await tx.studyCorrectionDelivery.updateMany({
        where: {
          sourceStudyId,
          courseSessionId,
          recipientOrganizationVersionId: { in: upgrades },
          transitionPlanSentAt: null,
        },
        data: { transitionPlanSentAt },
      })
    }
  }
}
