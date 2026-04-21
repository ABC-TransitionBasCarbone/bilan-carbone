import type { FullStudy } from '@/db/study'
import { Environment } from '@repo/db-common/enums'
import type { UserSession } from 'next-auth'
import { hasEditAccessOnStudy } from './study'

export const canSaveSituationOnStudy = async (
  studyId: string,
  study: Pick<FullStudy, 'contributors'>,
  session: { user: UserSession },
) => {
  const hasEditAccess = await hasEditAccessOnStudy(studyId, session)
  if (hasEditAccess) {
    return true
  }

  if (session.user.environment !== Environment.CLICKSON) {
    return false
  }

  return study.contributors.some((contributor) => contributor.accountId === session.user.accountId)
}
