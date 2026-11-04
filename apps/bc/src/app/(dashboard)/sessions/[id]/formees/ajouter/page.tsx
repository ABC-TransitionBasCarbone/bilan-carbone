import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import NewCourseSessionTraineeForm from '@/components/courseSession/NewCourseSessionTraineeForm'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { getProfessorCourseSessionTrainees } from '@/services/serverFunctions/courseSession'
import Block from '@abc-transitionbascarbone/common/components/base/Block'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { getTranslations } from 'next-intl/server'

interface Props {
  params: Promise<{ id: string }>
}

const NewSessionTraineePage = async ({ params }: Props & UserSessionProps) => {
  const { id } = await params
  const response = await getProfessorCourseSessionTrainees(id)
  if (!response.success) {
    throw new Error(response.errorMessage)
  }
  const [t, tNav] = await Promise.all([getTranslations('courseSessions'), getTranslations('nav')])

  return (
    <>
      <Breadcrumbs
        current={t('addTrainee')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: t('traineesTitle'), link: `/sessions/${id}/formees` },
        ]}
      />
      <Block
        title={t('addTrainee')}
        as="h1"
        actions={[
          {
            actionType: 'link',
            href: `/sessions/${id}/formees`,
            startIcon: <ArrowBackIcon />,
            variant: 'outlined',
            children: t('backToTrainees'),
          },
        ]}
      >
        <NewCourseSessionTraineeForm sessionId={id} />
      </Block>
    </>
  )
}

export default withAuth(NewSessionTraineePage)
