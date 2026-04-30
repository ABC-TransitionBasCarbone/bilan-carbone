import { getOrganizationVersionForRightsCheck } from '@/db/organization'
import { hasActiveLicence } from '@/utils/organization'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import EmissionFactorButtons from '../emissionFactor/EmissionFactorButtons'
import EmissionFactors from '../emissionFactor/EmissionFactors'
import withAuth, { UserSessionProps } from '../hoc/withAuth'

interface Props {
  userOrganizationId?: string
  environment: Environment
}

const EmissionFactorsPage = async ({ userOrganizationId, environment, user }: Props & UserSessionProps) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('emissionFactors')

  const userOrganization = await getOrganizationVersionForRightsCheck(user.organizationVersionId || '')
  const activeLicence = !!userOrganization && hasActiveLicence(userOrganization)

  return (
    <>
      <Breadcrumbs current={tNav('emissionFactors')} links={[{ label: tNav('home'), link: '/' }]} />
      <Block
        title={t('title')}
        as="h1"
        rightComponent={
          userOrganizationId && activeLicence ? (
            <EmissionFactorButtons addHref="/facteurs-d-emission/creer" />
          ) : undefined
        }
      >
        <Suspense fallback={t('loading')}>
          <EmissionFactors
            userOrganizationId={userOrganizationId}
            environment={environment}
            hasActiveLicence={activeLicence}
          />
        </Suspense>
      </Block>
    </>
  )
}

export default withAuth(EmissionFactorsPage)
