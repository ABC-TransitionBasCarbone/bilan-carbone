'use client'

import { addMember } from '@/services/serverFunctions/user'
import NewMemberFormCommon from '@abc-transitionbascarbone/components/src/team/NewMemberFormCommon'
import { Role } from '@abc-transitionbascarbone/db-common/enums'

const NewMemberForm = () => {
  return <NewMemberFormCommon environmentRoles={Role} addMember={addMember} />
}

export default NewMemberForm
