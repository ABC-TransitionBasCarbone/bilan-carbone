import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import StudyPage from '@/components/pages/Study'
import { hasAccessToStudyHomePage } from '@/services/permissions/environment'
import { redirect } from 'next/navigation'

const StudyView = async ({ study, user }: StudyProps & UserSessionProps) => {
  if (!hasAccessToStudyHomePage(user.environment)) {
    redirect(`/etudes/${study.id}/cadrage`)
  }

  return <StudyPage study={study} user={user} />
}

export default withAuth(withStudyDetails(StudyView))
