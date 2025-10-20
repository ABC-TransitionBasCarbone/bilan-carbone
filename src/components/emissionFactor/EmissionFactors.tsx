'use client'

import { Environment } from '@prisma/client'
import { UserSession } from 'next-auth'
import EmissionFactorsFiltersAndTable from './EmissionFactorsFiltersAndTable'

interface Props {
  userOrganizationId?: string
  manualOnly: boolean
  environment: Environment
  user: UserSession
}

const EmissionFactors = ({ userOrganizationId, manualOnly, environment }: Props) => {
  return (
    <EmissionFactorsFiltersAndTable
      userOrganizationId={userOrganizationId}
      environment={environment}
      manualOnly={manualOnly}
    />
  )
}

export default EmissionFactors
