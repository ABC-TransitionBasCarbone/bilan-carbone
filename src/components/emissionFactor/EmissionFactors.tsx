'use server'

import { getEmissionFactorSources } from '@/db/emissionFactors'
import { getEmissionFactors } from '@/services/serverFunctions/emissionFactor'
import { EmissionFactorImportVersion, Import } from '@prisma/client'
import EmissionFactorsTable from './Table'

interface Props {
  userOrganizationId: string | null
}

const EmissionFactors = async ({ userOrganizationId }: Props) => {
  const [emissionFactors, importVersions] = await Promise.all([getEmissionFactors(), getEmissionFactorSources()])
  const manualImport = { id: Import.Manual, source: Import.Manual, name: '' } as EmissionFactorImportVersion

  const initialSelectedSources = importVersions
    .filter((importVersion) =>
      importVersion.source === Import.Manual
        ? true
        : importVersion.id ===
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
