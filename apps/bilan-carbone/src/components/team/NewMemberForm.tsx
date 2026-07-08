'use client'

import { addMember } from '@/services/serverFunctions/user'
import { getEnvironmentRoles } from '@/utils/user'
import NewMemberFormCommon from '@abc-transitionbascarbone/components/src/team/NewMemberFormCommon'
import { Environment, Role } from '@abc-transitionbascarbone/db-common/enums'

interface Props {
  environment: Environment
}
const NewMemberForm = ({ environment }: Props) => {
  return (
    <NewMemberFormCommon environmentRoles={getEnvironmentRoles(environment) as typeof Role} addMember={addMember} />
  )
}

export default NewMemberForm
