import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import EmissionFactors from '../emissionFactor/EmissionFactors'

interface Props {
  userOrganizationId?: string
  manualOnly: boolean
}

const EmissionFactorsPage = ({ userOrganizationId, manualOnly }: Props) => {
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
          <EmissionFactors userOrganizationId={userOrganizationId} manualOnly={manualOnly} />
        </Suspense>
      </Block>
    </>
  )
}

export default EmissionFactorsPage
