import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import StudyPage from '@/components/pages/Study'
import { getSituationByStudySite } from '@/db/situation'
import {
  getStudyDefaultLandingPath,
  hasCompletedTiltSimplifiedGeneralData,
  isTiltSimplified,
} from '@/services/permissions/environmentAdvanced'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ showHome?: string }>
}

const StudyView = async ({ study, user, searchParams }: StudyProps & UserSessionProps & Props) => {
  const { showHome } = await searchParams

  if (showHome === 'true' && !study.simplified) {
    return <StudyPage study={study} user={user} />
  }

  let isTiltSimplifiedGeneralDataCompleted = false
  if (isTiltSimplified(user.environment, study.simplified) && study.sites.length > 0) {
    const situation = await getSituationByStudySite(study.sites[0].id)
    isTiltSimplifiedGeneralDataCompleted = hasCompletedTiltSimplifiedGeneralData(
      (situation?.situation as Record<string, unknown> | null | undefined) ?? null,
    )
  }

  redirect(
    getStudyDefaultLandingPath(user.environment, study.id, study.simplified, isTiltSimplifiedGeneralDataCompleted),
  )

  return <StudyPage study={study} user={user} />
}

export default withAuth(withStudyDetails(StudyView))
