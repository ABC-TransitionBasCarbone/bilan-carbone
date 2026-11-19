import { DAY, TIME_IN_MS } from '@abc-transitionbascarbone/common/utils'

export interface CorrectionRecipient {
  id: string
  organizationVersionId: string
  firstName: string
  lastName: string
  status: 'notSent' | 'withoutPlan' | 'withPlan'
}

export const getCorrectionTargets = (recipients: CorrectionRecipient[], includePlan: boolean) =>
  recipients.filter(({ status }) => status === 'notSent' || (includePlan && status === 'withoutPlan'))

export const getCorrectionTargetSnapshot = (recipients: CorrectionRecipient[]) =>
  JSON.stringify(
    recipients
      .map(({ id, organizationVersionId, firstName, lastName, status }) =>
        JSON.stringify([id, organizationVersionId, firstName, lastName, status]),
      )
      .sort(),
  )

export const correctionShareSessionDates = (now: Date) => ({
  startDate: { lte: now },
  endDate: { gt: new Date(now.getTime() - 14 * DAY * TIME_IN_MS) },
})

export const isCorrectionShareSessionEligible = (session: { startDate: Date; endDate: Date }, now: Date) => {
  const { startDate, endDate } = correctionShareSessionDates(now)
  return session.startDate <= startDate.lte && session.endDate > endDate.gt
}
