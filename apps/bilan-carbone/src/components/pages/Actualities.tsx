import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { getTranslations } from 'next-intl/server'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import ActualitiesList from '../actuality/ActualitiesList'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

interface Props {
  environment: Environment
}

const ActualitiesPage = async ({ environment }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('actuality')

  return (
    <>
      <Breadcrumbs current={tNav('actualities')} links={[{ label: tNav('home'), link: '/' }]} />
      <Block title={t('title')} as="h1">
        <ActualitiesList environment={environment} />
      </Block>
    </>
  )
}

export default ActualitiesPage
