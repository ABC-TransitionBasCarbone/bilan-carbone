import { FullStudy } from '@/db/study'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import ResultsTable from '../study/results/ResultsTable'

interface Props {
  study: FullStudy
}

const ResultsPage = ({ study }: Props) => {
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')

  return (
    <>
      <Breadcrumbs
        current={tStudyNav('results')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
        ]}
      />
      <Block title={tStudyNav('results')} as="h1">
        <ResultsTable study={study} />
      </Block>
    </>
  )
}

export default ResultsPage
