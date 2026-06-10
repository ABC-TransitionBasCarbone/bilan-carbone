'use client'

import { TeamMember } from '@/db/accountMip'
import { canEditSelfRole } from '@/services/permissions/user'
import { deleteOrganizationMember } from '@/services/serverFunctions/organization'
import { changeRole } from '@/services/serverFunctions/user'
import { canEditMemberRole } from '@/utils/user'
import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import type { TeamMemberCommon } from '@abc-transitionbascarbone/components/src/team/TeamTableCommon'
import TeamTableCommon from '@abc-transitionbascarbone/components/src/team/TeamTableCommon'
import { Role } from '@abc-transitionbascarbone/db-common/enums'
import { UserSession } from 'next-auth'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

interface Props {
  user: UserSession
  team: TeamMember[]
}

type DeletionErrorData = {
  id: string
  name: string
  organization: string
}

const TeamTable = ({ user, team }: Props) => {
  const [deletingMember, setDeletingMember] = useState('')
  const [deletionError, setDeletionError] = useState('')
  const [deletionErrorData, setDeletionErrorData] = useState<DeletionErrorData[] | undefined>(undefined)
  const canUpdateTeam = canEditMemberRole(user)
  const { callServerFunction } = useServerFunction()

  const router = useRouter()

  const deleteMember = useCallback(async () => {
    setDeletionErrorData(undefined)
    await callServerFunction(() => deleteOrganizationMember(deletingMember), {
      onSuccess: (data) => {
        if (data) {
          setDeletionError(data)
        } else {
          setDeletingMember('')
          router.refresh()
        }
      },
    })
  }, [deletingMember, callServerFunction, router])

  return (
    <>
      <TeamTableCommon
        email={user.email}
        team={team as TeamMemberCommon[]}
        canUpdateTeam={canUpdateTeam}
        environmentRoles={Role}
        deleteMember={deleteMember}
        isAdvanced={false}
        deletionError={deletionError}
        deletionErrorData={deletionErrorData}
        setDeletionErrorData={setDeletionErrorData}
        canEditSelfRole={canEditSelfRole(user.role)}
        canBeUntrainedRole={true}
        changeRole={changeRole}
        setDeletingMember={setDeletingMember}
        deletingMember={deletingMember}
      />
    </>
  )
}

export default TeamTable
