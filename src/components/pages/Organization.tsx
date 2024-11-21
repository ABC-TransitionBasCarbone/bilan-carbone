import React, { Suspense } from 'react'
import Block from '../base/Block'
import { useTranslations } from 'next-intl'
import OrganizationInfo from '../organization/Info'
import { OrganizationWithSites } from '@/db/user'
import { User } from 'next-auth'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import ResultsContainer from '../study/results/ResultsContainer'
import classNames from 'classnames'
import styles from './Organization.module.css'
import Studies from '../study/StudiesContainer'
import Box from '../base/Box'

interface Props {
  organizations: OrganizationWithSites[]
  user: User
}

const OrganizationPage = ({ organizations, user }: Props) => {
  const tNav = useTranslations('nav')
  const t = useTranslations('organization')
  return (
    <>
      <Breadcrumbs
        current={`${tNav('organization')} : ${organizations[0].name}`}
        links={[{ label: tNav('home'), link: '/' }]}
      />
      <Block title={t('title')} as="h1" />
      <Block>
        <Box className="mb1">
          <OrganizationInfo organization={organizations[0]} user={user} />
        </Box>
        <div className="flex-col">
          <Suspense>
            <ResultsContainer user={user} />
          </Suspense>
          <div className={classNames(styles.container, 'w100')}>
            <Studies user={user} orgnizationId={organizations[0].id} />
          </div>
        </div>
      </Block>
    </>
  )
}

export default OrganizationPage
