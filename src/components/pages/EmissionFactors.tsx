import { Environment } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import EmissionFactors from '../emissionFactor/EmissionFactors'
import withAuth from '../hoc/withAuth'

interface Props {
  userOrganizationId?: string
  environment: Environment
  user: UserSession
}

const EmissionFactorsPage = ({ userOrganizationId, user, environment }: Props) => {
  const tNav = useTranslations('nav')
  const t = useTranslations('emissionFactors')

  return (
    <>
      <Breadcrumbs current={tNav('emissionFactors')} links={[{ label: tNav('home'), link: '/' }]} />
      <Block
        title={t('title')}
        as="h1"
        actions={
          userOrganizationId
            ? [
                {
                  actionType: 'link',
                  href: '/facteurs-d-emission/creer',
                  'data-testid': 'new-emission',
                  children: t('add'),
                },
              ]
            : undefined
        }
      >
        <Suspense fallback={t('loading')}>
          <EmissionFactors userOrganizationId={userOrganizationId} user={user} environment={environment} />
        </Suspense>
      </Block>
    </>
  )
}

export default withAuth(EmissionFactorsPage)
