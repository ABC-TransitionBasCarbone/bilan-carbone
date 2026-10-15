import { canCreateEmissionFactor } from '@/services/permissions/emissionFactorAccess'
import { BCEnvironment } from '@/types/environment'
import Block from '@abc-transitionbascarbone/common/components/base/Block'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import EmissionFactorButtons from '../emissionFactor/EmissionFactorButtons'
import EmissionFactors from '../emissionFactor/EmissionFactors'
import withAuth, { UserSessionProps } from '../hoc/withAuth'

interface Props {
  userOrganizationId?: string
  environment: BCEnvironment
}

const EmissionFactorsPage = async ({ userOrganizationId, environment, user }: Props & UserSessionProps) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('emissionFactors')

  const canManageEmissionFactors = !!(await canCreateEmissionFactor(user))

  return (
    <>
      <Breadcrumbs current={tNav('emissionFactors')} links={[{ label: tNav('home'), link: '/' }]} />
      <Block
        title={t('title')}
        as="h1"
        rightComponent={userOrganizationId ? <EmissionFactorButtons disabled={!canManageEmissionFactors} /> : undefined}
      >
        <Suspense fallback={t('loading')}>
          <EmissionFactors
            userOrganizationId={userOrganizationId}
            environment={environment}
            canManageEmissionFactors={canManageEmissionFactors}
          />
        </Suspense>
      </Block>
    </>
  )
}

export default withAuth(EmissionFactorsPage)
