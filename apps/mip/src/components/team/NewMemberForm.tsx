'use client'

import { addMember } from '@/services/serverFunctions/user'
import NewMemberFormCommon from '@abc-transitionbascarbone/components/src/team/NewMemberFormCommon'
import { RoleMip } from '@abc-transitionbascarbone/db-common/enums'

const NewMemberForm = () => {
  return <NewMemberFormCommon environmentRoles={RoleMip} addMember={addMember} />
}

export default NewMemberForm
