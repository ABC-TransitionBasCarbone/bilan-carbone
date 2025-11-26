import { DetailedEmissionFactor } from '@/db/emissionFactors'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import EditEmissionFactorForm from '../emissionFactor/edit/Form'

interface Props {
  emissionFactor: Exclude<DetailedEmissionFactor, null>
  locations: string[]
}

const EditEmissionFactor = ({ emissionFactor, locations }: Props) => {
  const tNav = useTranslations('nav')
  const t = useTranslations('emissionFactors.edit')
  return (
    <>
      <Breadcrumbs
        current={t('title', { name: emissionFactor?.metaData[0].title || '' })}
        links={[
          { label: tNav('home'), link: '/' },
          { label: tNav('emissionFactors'), link: '/facteurs-d-emission' },
        ]}
      />
      <Block title={t('title', { name: emissionFactor?.metaData[0].title || '' })} as="h1">
        <EditEmissionFactorForm emissionFactor={emissionFactor} locations={locations} />
      </Block>
    </>
  )
}

export default EditEmissionFactor
