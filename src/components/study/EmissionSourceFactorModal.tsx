import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { getStudyEmissionFactorImportVersions } from '@/services/serverFunctions/study'
import { useAppContextStore } from '@/store/AppContext'
import { EmissionFactorImportVersion, Import } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import EmissionFactorsTable from '../emissionFactor/Table'
import Modal from '../modals/Modal'

interface Props {
  close: () => void
  open: boolean
  emissionFactors: EmissionFactorWithMetaData[]
  selectEmissionFactor: (emissionFactor: EmissionFactorWithMetaData) => void
}

const EmissionSourceFactorModal = ({ close, open, emissionFactors, selectEmissionFactor }: Props) => {
  const t = useTranslations('emissionSource.emissionFactorDialog')
  const [emissionFactorVersions, setVersions] = useState<EmissionFactorImportVersion[] | undefined>(undefined)
  const manualImport = { id: '', source: Import.Manual, name: '' } as EmissionFactorImportVersion
  const { contextId: studyId } = useAppContextStore()
  useEffect(() => {
    fetchSources(studyId)
  }, [studyId])

  const fetchSources = async (studyId: string) => {
    const versions = await getStudyEmissionFactorImportVersions(studyId)
    setVersions(versions)
  }

  return emissionFactorVersions ? (
    <Modal
      open={open}
      label="emission-source-factor"
      title={t('title')}
      onClose={close}
      actions={[{ actionType: 'button', onClick: close, children: t('cancel') }]}
      big
    >
      <EmissionFactorsTable
        emissionFactors={emissionFactors}
        selectEmissionFactor={selectEmissionFactor}
        importVersions={emissionFactorVersions.concat(manualImport)}
      />
    </Modal>
  ) : (
    <></>
  )
}

export default EmissionSourceFactorModal
