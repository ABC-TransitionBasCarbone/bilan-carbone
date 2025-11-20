import { EmissionFactorWithMetaData, getFELocations } from '@/services/serverFunctions/emissionFactor'
import { Environment, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { ImportVersionForFilters } from '../emissionFactor/EmissionFactorsFilters'
import EmissionFactorsFiltersAndTable from '../emissionFactor/EmissionFactorsFiltersAndTable'
import Modal from '../modals/Modal'

interface Props {
  open: boolean
  environment: Environment
  userOrganizationId?: string
  defaultSubPost: SubPost
  importVersions: ImportVersionForFilters[]
  studyId: string
  selectEmissionFactor: (emissionFactor: EmissionFactorWithMetaData) => void
  close: () => void
}

const EmissionSourceFactorModal = ({
  open,
  environment,
  userOrganizationId,
  defaultSubPost,
  importVersions,
  studyId,
  selectEmissionFactor,
  close,
}: Props) => {
  const t = useTranslations('emissionFactors')
  const tDialog = useTranslations('emissionSource.emissionFactorDialog')
  const [locationOptions, setLocationOptions] = useState<string[]>([])
  const [init, setInit] = useState(false)

  useEffect(() => {
    async function fetchFiltersInfos() {
      const locationFromBdd = await getFELocations()
      setLocationOptions(locationFromBdd.filter((loc) => !!loc).map((loc) => loc.location) ?? [])
    }

    fetchFiltersInfos()
  }, [])

  useEffect(() => {
    if (locationOptions.length >= 0) {
      setInit(true)
    }
  }, [importVersions, locationOptions])

  return (
    <Modal
      open={open}
      label="emission-source-factor"
      title={t('title')}
      onClose={close}
      actions={[{ actionType: 'button', onClick: close, children: tDialog('cancel') }]}
      big
    >
      {init ? (
        <EmissionFactorsFiltersAndTable
          userOrganizationId={userOrganizationId}
          environment={environment}
          importVersions={importVersions}
          initialImportVersions={importVersions.map((iv) => iv.id)}
          locationOptions={locationOptions}
          defaultSubPost={defaultSubPost}
          selectEmissionFactor={selectEmissionFactor}
          studyId={studyId}
          hasActiveLicence
        />
      ) : (
        <div>{t('loading')}</div>
      )}
    </Modal>
  )
}

export default EmissionSourceFactorModal
