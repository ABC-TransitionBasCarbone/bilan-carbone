import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import EmissionFactors from '../emissionFactor/EmissionFactors'

interface Props {
  userOrganizationId: string | null
}

const EmissionFactorsPage = ({ userOrganizationId }: Props) => {
  const tNav = useTranslations('nav')
  const t = useTranslations('emissionFactors')
  return (
    <>
      <Breadcrumbs current={tNav('emissionFactors')} links={[{ label: tNav('home'), link: '/' }]} />
      <Block
        title={t('title')}
        as="h1"
        actions={[
          { actionType: 'link', href: '/facteurs-d-emission/creer', 'data-testid': 'new-emission', children: t('add') },
        ]}
      >
        <Suspense fallback={t('loading')}>
          <EmissionFactors userOrganizationId={userOrganizationId} />
        </Suspense>
      </Block>
    </>
  )
}

export default EmissionFactorsPage
