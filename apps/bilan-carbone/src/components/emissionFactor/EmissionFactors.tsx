'use client'

import { hasAccessToManualImport } from '@/services/permissions/environment'
import { getEmissionFactorImportVersions, getFELocations } from '@/services/serverFunctions/emissionFactor'
import { BCEnvironment } from '@/types/environment'
import type { EmissionFactorImportVersion } from '@abc-transitionbascarbone/db-common'
import { Import } from '@abc-transitionbascarbone/db-common/enums'
import { useTranslations } from 'next-intl'
import { Suspense, useEffect, useState } from 'react'
import EmissionFactorsFiltersAndTable from './EmissionFactorsFiltersAndTable'

interface Props {
  userOrganizationId?: string
  environment: BCEnvironment
  hasActiveLicence: boolean
}

type FilterInfos = {
  importVersions: EmissionFactorImportVersion[]
  initialImportVersions: string[]
  locationOptions: string[]
}

const EmissionFactors = ({ userOrganizationId, environment, hasActiveLicence }: Props) => {
  const t = useTranslations('emissionFactors')

  const [filterInfos, setFilterInfos] = useState<FilterInfos | null>(null)

  useEffect(() => {
    async function fetchFilterInfos() {
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

      const locationOptions = locationFromBdd.flatMap((loc) => (loc.location ? [loc.location] : []))

      const importVersions = importVersionsFromBdd.sort((a, b) => {
        if (a.source === b.source) {
          return b.createdAt.getTime() - a.createdAt.getTime()
        } else {
          return `${a.source} ${a.name}`.localeCompare(`${b.source} ${b.name}`)
        }
      })

      const initialImportVersions = importVersionsFromBdd
        .map((iv) => iv.id)
        .filter((id) => selectedImportVersionsArray.includes(id))

      if (hasAccessToManualImport(environment)) {
        setFilterInfos({
          locationOptions,
          initialImportVersions:
            importVersionsFromBdd.length > 0 ? [Import.Manual, ...initialImportVersions] : [Import.Manual],
          importVersions: [
            { id: Import.Manual, source: Import.Manual, name: '' } as EmissionFactorImportVersion,
            ...importVersions,
          ],
        })
      } else {
        setFilterInfos({
          locationOptions,
          importVersions,
          initialImportVersions,
        })
      }
    }

    fetchFilterInfos()
  }, [environment])

  if (!filterInfos) {
    return <div>{t('loading')}</div>
  }

  return (
    <Suspense fallback={<div>{t('loading')}</div>}>
      <EmissionFactorsFiltersAndTable
        userOrganizationId={userOrganizationId}
        environment={environment}
        importVersions={filterInfos.importVersions}
        initialImportVersions={filterInfos.initialImportVersions}
        locationOptions={filterInfos.locationOptions}
        hasActiveLicence={hasActiveLicence}
      />
    </Suspense>
  )
}

export default EmissionFactors
