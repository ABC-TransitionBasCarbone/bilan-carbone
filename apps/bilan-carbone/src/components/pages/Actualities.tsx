import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { getTranslations } from 'next-intl/server'
import ActualitiesList from '../actuality/ActualitiesList'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

const ActualitiesPage = async () => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('actuality')

  return (
    <>
      <Breadcrumbs current={tNav('actualities')} links={[{ label: tNav('home'), link: '/' }]} />
      <Block title={t('title')} as="h1">
        <ActualitiesList />
      </Block>
    </>
  )
}

export default ActualitiesPage
