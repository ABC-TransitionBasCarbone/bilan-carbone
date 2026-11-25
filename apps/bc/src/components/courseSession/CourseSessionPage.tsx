import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import Studies from '@/components/study/Studies'
import { getStudyCards } from '@/db/study'
import { getProfessorCourseSession } from '@/services/serverFunctions/courseSession'
import NotFound from '@abc-transitionbascarbone/common/components/pages/NotFound'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import CourseSessionHeader from './CourseSessionHeader'

interface Props {
  sessionId: string
  user: UserSession
}

const CourseSessionPage = async ({ sessionId, user }: Props) => {
  const response = await getProfessorCourseSession(sessionId)
  if (!response.success) {
    throw new Error(response.errorMessage)
  }
  const session = response.data
  if (!session) {
    return <NotFound />
  }

  const ids = session.studies.map(({ id }) => id)
  const [studies, tNav] = await Promise.all([getStudyCards(ids), getTranslations('nav')])

  return (
    <>
      <Breadcrumbs current={session.name} links={[{ label: tNav('home'), link: '/' }]} />
      <CourseSessionHeader session={session} />
      <Studies studies={studies} canAddStudy={false} user={user} courseSession />
    </>
  )
}

export default CourseSessionPage
