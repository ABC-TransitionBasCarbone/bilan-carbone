import CourseSessionPage from '@/components/courseSession/CourseSessionPage'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { dbActualizedAuth } from '@/services/auth'
import NotFound from '@abc-transitionbascarbone/common/components/pages/NotFound'

interface Props {
  params: Promise<{ id: string }>
}

const SessionView = async ({ params }: Props & UserSessionProps) => {
  const [{ id }, session] = await Promise.all([params, dbActualizedAuth()])
  if (!id || !session?.user) {
    return <NotFound />
  }

  return <CourseSessionPage sessionId={id} user={session.user} />
}

export default withAuth(SessionView)
