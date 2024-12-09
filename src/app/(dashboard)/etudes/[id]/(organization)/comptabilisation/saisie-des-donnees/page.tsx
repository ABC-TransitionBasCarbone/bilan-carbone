import Block from '@/components/base/Block'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import NotFound from '@/components/pages/NotFound'
import StudyContributorPage from '@/components/pages/StudyContributor'
import AllPostsInfography from '@/components/study/infography/AllPostsInfography'
import { getStudyById } from '@/db/study'
import { auth } from '@/services/auth'
import { canReadStudy, canReadStudyDetail, filterStudyDetail } from '@/services/permissions/study'
import { UUID } from 'crypto'
import { getTranslations } from 'next-intl/server'

interface Props {
  params: Promise<{
    id: UUID
  }>
}
const DataEntry = async (props: Props) => {
  const session = await auth()
  const tNav = await getTranslations('nav')
  const tStudyNav = await getTranslations('study.navigation')

  const params = await props.params
  const id = params.id
  if (!id || !session) {
    return <NotFound />
  }

  const study = await getStudyById(id, session.user.organizationId)

  if (!study) {
    return <NotFound />
  }

  if (!(await canReadStudyDetail(session.user, study))) {
    if (!(await canReadStudy(session.user, study))) {
      return <NotFound />
    }
    const studyWithoutDetail = filterStudyDetail(session.user, study)
    return <StudyContributorPage study={studyWithoutDetail} user={session.user} />
  }

  return (
    <>
      <Breadcrumbs
        current={tStudyNav('dataEntry')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
        ]}
      />
      <Block title={tStudyNav('dataEntry')} as="h1">
        <AllPostsInfography study={study} />
      </Block>
    </>
  )
}

export default DataEntry
