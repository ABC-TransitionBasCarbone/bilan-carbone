import { correctionShareSessionDates } from '@/services/studyCorrectionSharing'
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
        select: { recipientOrganizationVersionId: true, copiedStudyId: true, transitionPlanSentAt: true },
      },
    },
  })

export const recordCorrectionDelivery = (
  tx: Prisma.TransactionClient,
  sourceStudyId: string,
  courseSessionId: string,
  recipientOrganizationVersionId: string,
  copiedStudyId: string,
  includePlan: boolean,
) => {
  const recipient = { sourceStudyId, courseSessionId, recipientOrganizationVersionId }
  const transitionPlanSentAt = includePlan ? new Date() : null
  return tx.studyCorrectionDelivery.upsert({
    where: { sourceStudyId_courseSessionId_recipientOrganizationVersionId: recipient },
    create: { ...recipient, copiedStudyId, transitionPlanSentAt },
    update: { transitionPlanSentAt },
  })
}
