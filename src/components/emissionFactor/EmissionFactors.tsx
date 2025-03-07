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
  const manualImport = { id: '', source: Import.Manual, name: '' } as EmissionFactorImportVersion
  return (
    <EmissionFactorsTable
      emissionFactors={emissionFactors}
      userOrganizationId={userOrganizationId}
      importVersions={importVersions.concat([manualImport])}
    />
  )
}

export default EmissionFactors
