import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import OrganizationInfo from '../organization/Info'
import { OrganizationWithSites } from '@/db/user'
import { User } from 'next-auth'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import classNames from 'classnames'
import styles from './Organization.module.css'
import Studies from '../study/StudiesContainer'
import ResultsContainerForUser from '../study/results/ResultsContainerForUser'
import Block from '../base/Block'

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
        <div className={classNames(styles.container, 'w100')}>
          <Studies user={user} organizationId={organizations[0].id} />
        </div>
      </Block>
    </>
  )
}

export default OrganizationPage
