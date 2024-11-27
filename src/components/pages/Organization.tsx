import { OrganizationWithSites } from '@/db/user'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import OrganizationInfo from '../organization/Info'
import Studies from '../study/StudiesContainer'
import ResultsContainerForUser from '../study/results/ResultsContainerForUser'

interface Props {
  organizations: OrganizationWithSites[]
  user: User
}

const OrganizationPage = ({ organizations, user }: Props) => {
  const tNav = useTranslations('nav')

  return (
    <>
      <Breadcrumbs
        current={`${tNav('organization')} : ${organizations[0].name}`}
        links={[{ label: tNav('home'), link: '/' }]}
      />
      <OrganizationInfo organization={organizations[0]} user={user} />
      <Block>
        <Suspense>
          <ResultsContainerForUser user={user} />
        </Suspense>
        <Studies user={user} organizationId={organizations[0].id} />
      </Block>
    </>
  )
}

export default OrganizationPage
