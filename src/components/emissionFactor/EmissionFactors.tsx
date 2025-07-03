'use server'

import { getEmissionFactorImportVersions, getEmissionFactors } from '@/services/serverFunctions/emissionFactor'
import { EmissionFactorImportVersion, Import } from '@prisma/client'
import { UserSession } from 'next-auth'
import NotFound from '../pages/NotFound'
import EmissionFactorsTable from './Table'

interface Props {
  userOrganizationId?: string
  manualOnly: boolean
  user: UserSession
}

const EmissionFactors = async ({ userOrganizationId, manualOnly, user }: Props) => {
  const [emissionFactors, importVersionsRes] = await Promise.all([
    getEmissionFactors(),
    getEmissionFactorImportVersions(user),
  ])
  const manualImport = { id: Import.Manual, source: Import.Manual, name: '' } as EmissionFactorImportVersion

  if (!importVersionsRes.success) {
    return <NotFound />
  }

  const importVersions = importVersionsRes.data

  const initialSelectedSources = importVersions
    .filter((importVersion) =>
      importVersion.source === Import.Manual
        ? true
        : !manualOnly &&
          importVersion.id ===
            importVersions
              .filter((version) => version.source === importVersion.source)
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].id,
    )
    .map((importVersion) => importVersion.id)

  return (
    <EmissionFactorsTable
      emissionFactors={emissionFactors.success ? emissionFactors.data : []}
      userOrganizationId={userOrganizationId}
      importVersions={importVersions.concat([manualImport])}
      initialSelectedSources={initialSelectedSources.concat([manualImport.id])}
    />
  )
}

export default EmissionFactors
