'use client'

import { getEmissionFactorImportVersions, getFELocations } from '@/services/serverFunctions/emissionFactor'
import { EmissionFactorImportVersion, Environment, Import } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import EmissionFactorsFiltersAndTable from './EmissionFactorsFiltersAndTable'

interface Props {
  userOrganizationId?: string
  environment: Environment
  hasActiveLicence: boolean
}

const EmissionFactors = ({ userOrganizationId, environment, hasActiveLicence }: Props) => {
  const t = useTranslations('emissionFactors')

  const [importVersions, setImportVersions] = useState<EmissionFactorImportVersion[]>([])
  const [initialImportVersions, setInitialImportVersions] = useState<string[]>([])
  const [locationOptions, setLocationOptions] = useState<string[]>([])
  const [init, setInit] = useState(false)

  useEffect(() => {
    async function fetchFiltersInfos() {
      const importVersionsResponse = await getEmissionFactorImportVersions()

      if (!importVersionsResponse.success) {
        console.error('Failed to fetch emission factor import versions')
        return
      }

      const importVersionsFromBdd = importVersionsResponse.data
      const locationFromBdd = await getFELocations()
      const selectedImportVersions: Record<string, string> = {}
      const sortedImportVersions = importVersionsFromBdd.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      for (const iv of sortedImportVersions) {
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

  return init ? (
    <EmissionFactorsFiltersAndTable
      userOrganizationId={userOrganizationId}
      environment={environment}
      importVersions={importVersions}
      initialImportVersions={initialImportVersions}
      locationOptions={locationOptions}
      hasActiveLicence={hasActiveLicence}
    />
  ) : (
    <div>{t('loading')}</div>
  )
}

export default EmissionFactors
