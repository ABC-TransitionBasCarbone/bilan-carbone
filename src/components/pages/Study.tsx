import { FullStudy } from '@/db/study'
import { useTranslations } from 'next-intl'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyDetails from '../study/StudyDetails'

interface Props {
  study: FullStudy
}

const StudyPage = ({ study }: Props) => {
  const tNav = useTranslations('nav')

  return (
    <>
      <Breadcrumbs
        current={study.name}
        links={[
          { label: tNav('home'), link: '/' },
          study.organization.isCR
            ? {
                label: study.organization.name,
                link: `/organization/${study.organization.id}`,
              }
            : undefined,
        ].filter((link) => link !== undefined)}
      />
      <StudyDetails study={study} />
    </>
  )
}

export default StudyPage
