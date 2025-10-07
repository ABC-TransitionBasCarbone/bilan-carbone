'use server'

import { environmentSubPostsMapping, Post } from '@/services/posts'
import { getEmissionFactors, mapImportVersions } from '@/services/serverFunctions/emissionFactor'
import { EmissionFactorImportVersion, Environment, Import } from '@prisma/client'
import EmissionFactorsTable from './Table'

interface Props {
  userOrganizationId?: string
  manualOnly: boolean
  environment: Environment
}

const EmissionFactors = async ({ userOrganizationId, manualOnly, environment }: Props) => {
  const emissionFactors = await getEmissionFactors()

  const importVersions = emissionFactors.success ? await mapImportVersions(emissionFactors.data) : []
  const manualImport = { id: Import.Manual, source: Import.Manual, name: '' } as EmissionFactorImportVersion

  const initialSelectedSources = importVersions
    .filter(
      (importVersion) =>
        importVersion.source === Import.Manual ||
        (!manualOnly &&
          importVersion.id ===
            importVersions
              .filter((v) => v.source === importVersion.source)
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].id),
    )
    .map((importVersion) => importVersion.id)

  const subPostsByPost = environmentSubPostsMapping[environment]
  const initialSelectedSubPosts = Object.values(subPostsByPost).flatMap((subPosts) => subPosts)
  const posts = Object.keys(subPostsByPost) as Post[]

  return (
    <EmissionFactorsTable
      emissionFactors={emissionFactors.success ? emissionFactors.data : []}
      userOrganizationId={userOrganizationId}
      importVersions={importVersions.concat([manualImport])}
      initialSelectedSources={initialSelectedSources.concat([manualImport.id])}
      environment={environment}
      envPosts={posts}
      initialSelectedSubPosts={initialSelectedSubPosts}
    />
  )
}

export default EmissionFactors
