import { Environment } from '@repo/db-common/enums'
import type { UserSession } from 'next-auth'
import { hasEditAccessOnStudy } from './study'

export const isSimplifiedContributor = (
  study: { contributors: Array<{ accountId: string }> },
  session: { user: UserSession },
) => {
  return (
    session.user.environment === Environment.CLICKSON &&
    study.contributors.some((contributor) => contributor.accountId === session.user.accountId)
  )
}

export const canSaveSituationOnStudy = async (
  studyId: string,
  study: { contributors: Array<{ accountId: string }> },
  session: { user: UserSession },
) => {
  const hasEditAccess = await hasEditAccessOnStudy(studyId, session)
  if (hasEditAccess) {
    return true
  }

  return isSimplifiedContributor(study, session)
}
