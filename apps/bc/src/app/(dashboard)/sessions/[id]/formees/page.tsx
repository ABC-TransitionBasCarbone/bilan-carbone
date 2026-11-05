import CourseSessionTraineesActions from '@/components/courseSession/CourseSessionTraineesActions'
import CourseSessionTraineesTable from '@/components/courseSession/CourseSessionTraineesTable'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { getCourseSessionDetails, getProfessorCourseSessionTrainees } from '@/services/serverFunctions/courseSession'
import Block from '@abc-transitionbascarbone/common/components/base/Block'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { getTranslations } from 'next-intl/server'

interface Props {
  params: Promise<{ id: string }>
}

const SessionTraineesPage = async ({ params }: Props & UserSessionProps) => {
  const { id } = await params
  const [response, sessionResponse] = await Promise.all([
    getProfessorCourseSessionTrainees(id),
    getCourseSessionDetails(id),
  ])
  if (!response.success) {
    throw new Error(response.errorMessage)
  }
  if (!sessionResponse.success) {
    throw new Error(sessionResponse.errorMessage)
  }

  const t = await getTranslations('courseSessions')

  return (
    <Block
      title={t('traineesTitle')}
      as="h1"
      id="course-session-trainees-table-title"
      actions={[
        {
          actionType: 'node',
          node: (
            <CourseSessionTraineesActions
              sessionId={id}
              trainees={response.data}
              endDate={sessionResponse.data.endDate}
            />
          ),
        },
        {
          actionType: 'link',
          href: `/sessions/${id}`,
          startIcon: <ArrowBackIcon />,
          variant: 'outlined',
          children: t('backToSession'),
        },
      ]}
    >
      <CourseSessionTraineesTable sessionId={id} trainees={response.data} endDate={sessionResponse.data.endDate} />
    </Block>
  )
}

export default withAuth(SessionTraineesPage)
