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
