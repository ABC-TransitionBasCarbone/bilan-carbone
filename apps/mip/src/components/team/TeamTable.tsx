'use client'

import { TeamMember } from '@/db/accountMip'
import { canEditSelfRole } from '@/services/permissions/user'
import { changeRole } from '@/services/serverFunctions/user'
import { canEditMemberRole } from '@/utils/user'
import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import type { TeamMemberCommon } from '@abc-transitionbascarbone/components/src/team/TeamTableCommon'
import TeamTableCommon from '@abc-transitionbascarbone/components/src/team/TeamTableCommon'
import { UserSession } from 'next-auth'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Role } from '@abc-transitionbascarbone/db-common/enums'

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
    // setDeletionErrorData(undefined)
    // await callServerFunction(() => deleteOrganizationMember(deletingMember), {
    //   onSuccess: (data) => {
    //     if (data) {
    //       // Handle the case where deletion failed due to business rules
    //       setDeletionError(data.code)
    //       setDeletionErrorData(
    //         data.studies.map((study) => ({
    //           id: study.id,
    //           name: study.name,
    //           organization: study.organizationVersion.organization.name,
    //         })),
    //       )
    //     } else {
    //       setDeletingMember('')
    //       router.refresh()
    //     }
    //   },
    // })
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
      />
    </>
  )
}

export default TeamTable
