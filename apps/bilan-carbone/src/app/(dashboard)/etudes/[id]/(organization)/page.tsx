import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import StudyPage from '@/components/pages/Study'
import { getStudyDefaultLandingPath } from '@/utils/study'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ showHome?: string }>
}

const StudyView = async ({ study, user, searchParams }: StudyProps & UserSessionProps & Props) => {
  const { showHome } = await searchParams

  if (showHome === 'true') {
    return <StudyPage study={study} user={user} />
  }

  redirect(await getStudyDefaultLandingPath(user.environment, study.id, study.sites, study.simplified))
}

export default withAuth(withStudyDetails(StudyView))
