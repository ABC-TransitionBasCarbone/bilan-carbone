import { FullStudy } from '@/db/study'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import NewStudyContributorForm from '../study/rights/NewStudyContributorForm'

interface Props {
  study: FullStudy
}

const NewStudyContributorPage = async ({ study }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('study.rights.newContributor')

  return (
    <>
      <Breadcrumbs
        current={tNav('newStudyContributor')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
          { label: tNav('studyRights'), link: `/etudes/${study.id}/cadrage` },
        ]}
      />
      <Block title={t('title', { name: study.name })} as="h1">
        <NewStudyContributorForm study={study} />
      </Block>
    </>
  )
}

export default NewStudyContributorPage
