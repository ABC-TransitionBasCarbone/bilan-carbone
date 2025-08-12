import { environmentSubPostsMapping, Post } from '@/services/posts'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { getStudyEmissionFactorImportVersions } from '@/services/serverFunctions/study'
import { useAppContextStore } from '@/store/AppContext'
import { EmissionFactorImportVersion, Environment, Import, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import EmissionFactorsTable from '../emissionFactor/Table'
import Modal from '../modals/Modal'

interface Props {
  close: () => void
  open: boolean
  emissionFactors: EmissionFactorWithMetaData[]
  subPost: SubPost
  selectEmissionFactor: (emissionFactor: EmissionFactorWithMetaData) => void
  environment: Environment
}

const EmissionSourceFactorModal = ({
  close,
  open,
  emissionFactors,
  subPost,
  selectEmissionFactor,
  environment,
}: Props) => {
  const t = useTranslations('emissionSource.emissionFactorDialog')
  const [emissionFactorVersions, setEmissionFactorVersions] = useState<EmissionFactorImportVersion[] | undefined>(
    undefined,
  )
  const manualImport = { id: Import.Manual, source: Import.Manual, name: '' } as EmissionFactorImportVersion
  const { contextId: studyId } = useAppContextStore()
  useEffect(() => {
    fetchSources(studyId)
  }, [studyId])

  const fetchSources = async (studyId: string) => {
    const versions = await getStudyEmissionFactorImportVersions(studyId)
    if (versions.success) {
      setEmissionFactorVersions(versions.data)
    }
  }

  const initialSelectedSources = (emissionFactorVersions || [])
    .map((importVersion) => importVersion.id)
    .concat([Import.Manual])

  const subPostsByPost = environmentSubPostsMapping[environment]
  const posts = Object.keys(subPostsByPost) as Post[]

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
        initialSelectedSources={initialSelectedSources}
        initialSelectedSubPosts={[subPost]}
        environment={environment}
        envPosts={posts}
      />
    </Modal>
  ) : (
    <></>
  )
}

export default EmissionSourceFactorModal
