'use client'

import type { TeamMember } from '@/db/accountMip'
import { deleteOrganizationMember } from '@/services/serverFunctions/organization'
import { changeRole } from '@/services/serverFunctions/user'
import { canEditMemberRole } from '@/utils/user'
import { useServerFunction } from '@abc-transitionbascarbone/application/components/hooks/useServerFunction'
import TeamTableCommon from '@abc-transitionbascarbone/application/components/team/TeamTableCommon'
import { Environment, RoleMip } from '@abc-transitionbascarbone/db/enums'
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
      onSuccess: () => {
        setDeletingMember('')
        router.refresh()
      },
      onError: (error) => {
        setDeletionError(error)
      },
    })
  }, [deletingMember, callServerFunction, router])

  return (
    <>
      <TeamTableCommon
        email={user.email}
        team={team}
        canUpdateTeam={canUpdateTeam}
        environmentRoles={Object.values(RoleMip) as RoleMip[]}
        deleteMember={deleteMember}
        isAdvanced={false}
        deletionError={deletionError}
        deletionErrorData={deletionErrorData}
        setDeletionErrorData={setDeletionErrorData}
        canEditSelfRole={false}
        changeRole={changeRole}
        setDeletingMember={setDeletingMember}
        deletingMember={deletingMember}
        environment={Environment.MIP}
      />
    </>
  )
}

export default TeamTable
