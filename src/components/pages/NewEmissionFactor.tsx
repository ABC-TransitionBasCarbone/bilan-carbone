import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import NewEmissionFactorForm from '../emissionFactor/new/Form'

interface Props {
  locations: string[]
}

const NewEmissionFactorPage = ({ locations }: Props) => {
  const tNav = useTranslations('nav')
  const t = useTranslations('emissionFactors.create')
  return (
    <>
      <Breadcrumbs
        current={t('title')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: tNav('emissionFactors'), link: '/facteurs-d-emission' },
        ]}
      />
      <Block title={t('title')} as="h1">
        <NewEmissionFactorForm locations={locations} />
      </Block>
    </>
  )
}

export default NewEmissionFactorPage
