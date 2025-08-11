'use server'

import { getEmissionFactorSources } from '@/db/emissionFactors'
import { getEmissionFactors } from '@/services/serverFunctions/emissionFactor'
import { EmissionFactorImportVersion, Environment, Import } from '@prisma/client'
import EmissionFactorsTable from './Table'
import { environmentSubPostsMapping } from '@/services/posts'

interface Props {
  userOrganizationId?: string
  manualOnly: boolean
  environment: Environment
}

const EmissionFactors = async ({ userOrganizationId, manualOnly, environment }: Props) => {
  const [emissionFactors, importVersions] = await Promise.all([getEmissionFactors(), getEmissionFactorSources()])
  const manualImport = { id: Import.Manual, source: Import.Manual, name: '' } as EmissionFactorImportVersion

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


  const initialSelectedSubPosts = Object.values(environmentSubPostsMapping[environment]).flatMap((subPosts) => subPosts)

  return (
    <EmissionFactorsTable
      emissionFactors={emissionFactors.success ? emissionFactors.data : []}
      userOrganizationId={userOrganizationId}
      importVersions={importVersions.concat([manualImport])}
      initialSelectedSources={initialSelectedSources.concat([manualImport.id])}
      initialSelectedSubPosts={initialSelectedSubPosts}
    />
  )
}

export default EmissionFactors
