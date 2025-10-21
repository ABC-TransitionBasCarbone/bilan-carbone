'use client'

import { Environment } from '@prisma/client'
import { UserSession } from 'next-auth'
import EmissionFactorsFiltersAndTable from './EmissionFactorsFiltersAndTable'

interface Props {
  userOrganizationId?: string
  environment: Environment
  user: UserSession
}

const EmissionFactors = ({ userOrganizationId, environment }: Props) => {
  return <EmissionFactorsFiltersAndTable userOrganizationId={userOrganizationId} environment={environment} />
}

export default EmissionFactors
