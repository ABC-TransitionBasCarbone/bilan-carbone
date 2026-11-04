import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { getProfessorCourseSession } from '@/services/serverFunctions/courseSession'
import Block from '@abc-transitionbascarbone/common/components/base/Block'
import LinkButton from '@abc-transitionbascarbone/common/components/base/LinkButton'
import NotFound from '@abc-transitionbascarbone/common/components/pages/NotFound'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { getTranslations } from 'next-intl/server'

interface Props {
  params: Promise<{ id: string }>
}

const SessionTraineesPage = async ({ params }: Props & UserSessionProps) => {
  const { id } = await params
  const response = await getProfessorCourseSession(id)
  if (!response.success) {
    throw new Error(response.errorMessage)
  }
  if (!response.data) {
    return <NotFound />
  }

  const t = await getTranslations('courseSessions')

  return (
    <Block>
      <h1>{t('traineesTitle')}</h1>
      <LinkButton href={`/sessions/${id}`} startIcon={<ArrowBackIcon />}>
        {t('backToSession')}
      </LinkButton>
    </Block>
  )
}

export default withAuth(SessionTraineesPage)
