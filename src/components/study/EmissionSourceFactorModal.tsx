import { getFELocations, getImportVersions } from '@/services/serverFunctions/emissionFactor'
import { EmissionFactorImportVersion, Environment, Import } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import EmissionFactorsFiltersAndTable from '../emissionFactor/EmissionFactorsFiltersAndTable'
import Modal from '../modals/Modal'

interface Props {
  open: boolean
  environment: Environment
  userOrganizationId?: string
  close: () => void
}

const EmissionSourceFactorModal = ({ open, environment, userOrganizationId, close }: Props) => {
  const t = useTranslations('emissionFactors')

  const [importVersions, setImportVersions] = useState<EmissionFactorImportVersion[]>([])
  const [initialImportVersions, setInitialImportVersions] = useState<string[]>([])
  const [locationOptions, setLocationOptions] = useState<string[]>([])
  const [init, setInit] = useState(false)

  useEffect(() => {
    async function fetchFiltersInfos() {
      const importVersionsFromBdd = await getImportVersions()
      const locationFromBdd = await getFELocations()
      const selectedImportVersions: Record<string, string> = {}
      for (const iv of importVersionsFromBdd.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())) {
        if (selectedImportVersions[iv.source]) {
          continue
        }
        selectedImportVersions[iv.source] = iv.id
      }
      const selectedImportVersionsArray = Object.values(selectedImportVersions)

      setLocationOptions(locationFromBdd.filter((loc) => !!loc).map((loc) => loc.location) ?? [])
      const manualImport = { id: Import.Manual, source: Import.Manual, name: '' }
      setImportVersions([
        manualImport as EmissionFactorImportVersion,
        ...importVersionsFromBdd.sort((a, b) => {
          if (a.source === b.source) {
            return b.createdAt.getTime() - a.createdAt.getTime()
          } else {
            return `${a.source} ${a.name}`.localeCompare(`${b.source} ${b.name}`)
          }
        }),
      ])
      setInitialImportVersions(
        importVersionsFromBdd.length > 0
          ? [
              Import.Manual,
              ...importVersionsFromBdd.map((iv) => iv.id).filter((id) => selectedImportVersionsArray.includes(id)),
            ]
          : [Import.Manual],
      )
    }

    fetchFiltersInfos()
  }, [])

  useEffect(() => {
    if (importVersions.length > 0 && locationOptions.length >= 0 && initialImportVersions.length > 0) {
      setInit(true)
    }
  }, [importVersions, initialImportVersions.length, locationOptions])
  // const t = useTranslations('emissionSource.emissionFactorDialog')
  // const [emissionFactorVersions, setEmissionFactorVersions] = useState<EmissionFactorImportVersion[] | undefined>(
  //   undefined,
  // )
  // const manualImport = { id: Import.Manual, source: Import.Manual, name: '' } as EmissionFactorImportVersion
  // const { contextId: studyId } = useAppContextStore()
  // useEffect(() => {
  //   fetchSources(studyId)
  // }, [studyId])

  // const fetchSources = async (studyId: string) => {
  //   const versions = await getStudyEmissionFactorImportVersions(studyId)
  //   if (versions.success) {
  //     setEmissionFactorVersions(versions.data)
  //   }
  // }

  // const initialSelectedSources = (emissionFactorVersions || [])
  //   .map((importVersion) => importVersion.id)
  //   .concat([Import.Manual])

  // const subPostsByPost = environmentSubPostsMapping[environment]
  // const posts = Object.keys(subPostsByPost) as Post[]

  return (
    <Modal
      open={open}
      label="emission-source-factor"
      title={t('title')}
      onClose={close}
      actions={[{ actionType: 'button', onClick: close, children: t('cancel') }]}
      big
    >
      {init ? (
        <EmissionFactorsFiltersAndTable
          userOrganizationId={userOrganizationId}
          environment={environment}
          importVersions={importVersions}
          initialImportVersions={initialImportVersions}
          locationOptions={locationOptions}
        />
      ) : (
        <div>{t('loading')}</div>
      )}
    </Modal>
  )
}

export default EmissionSourceFactorModal
