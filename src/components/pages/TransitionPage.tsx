import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import OrganizationsTransition from '../transition/Organizations'

const TransitionPage = () => {
  const tNav = useTranslations('nav')
  const t = useTranslations('transition')

  return (
    <>
      <Breadcrumbs current={tNav('transition')} links={[{ label: tNav('home'), link: '/' }]} />
      <Block title={t('organizations')} as="h1">
        <OrganizationsTransition />
      </Block>
    </>
  )
}

export default TransitionPage
