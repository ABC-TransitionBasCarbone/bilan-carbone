import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { useTranslations } from 'next-intl'
import Modal from '../base/Modal'
import EmissionFactorsTable from '../emissionFactor/Table'

interface Props {
  close: () => void
  open: boolean
  emissionFactors: EmissionFactorWithMetaData[]
  selectEmissionFactor: (emissionFactor: EmissionFactorWithMetaData) => void
}

const EmissionSourceFactorModal = ({ close, open, emissionFactors, selectEmissionFactor }: Props) => {
  const t = useTranslations('emissionSource.emissionFactorDialog')
  return (
    <>
      <Modal
        open={open}
        label="emission-source-factor"
        title={t('title')}
        onClose={close}
        actions={[{ actionType: 'button', onClick: close, children: t('cancel') }]}
      >
        <EmissionFactorsTable emissionFactors={emissionFactors} selectEmissionFactor={selectEmissionFactor} />
      </Modal>
    </>
  )
}

export default EmissionSourceFactorModal
