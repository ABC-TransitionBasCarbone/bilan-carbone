'use client'

import { addMember } from '@/services/serverFunctions/user'
import NewMemberFormCommon from '@abc-transitionbascarbone/common/components/team/NewMemberFormCommon'
import { RoleMip } from '@abc-transitionbascarbone/common/db/enums'

const NewMemberForm = () => {
  return <NewMemberFormCommon environmentRoles={RoleMip} addMember={addMember} />
}

export default NewMemberForm
