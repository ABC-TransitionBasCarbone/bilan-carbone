'use client'

import { TeamMember } from '@/db/account'
import { isAdvanced } from '@/services/permissions/environment'
import { canEditSelfRole } from '@/services/permissions/user'
import { deleteOrganizationMember } from '@/services/serverFunctions/organization'
import { changeRole } from '@/services/serverFunctions/user'
import { canBeUntrainedRole, canEditMemberRole, getEnvironmentRoles } from '@/utils/user'
import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import TeamTableCommon from '@abc-transitionbascarbone/components/src/team/TeamTableCommon'
import { UserSession } from 'next-auth'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

interface Props {
  user: UserSession
  team: TeamMember[]
  crOrga: boolean
}

type DeletionErrorData = {
  id: string
  name: string
  organization: string
}

const TeamTable = ({ user, team, crOrga }: Props) => {
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
          // Handle the case where deletion failed due to business rules
          setDeletionError(data.code)
          setDeletionErrorData(
            data.studies.map((study) => ({
              id: study.id,
              name: study.name,
              organization: study.organizationVersion.organization.name,
            })),
          )
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
        team={team}
        canUpdateTeam={canUpdateTeam}
        environmentRoles={getEnvironmentRoles(user.environment)}
        deleteMember={deleteMember}
        isAdvanced={isAdvanced(user.environment)}
        deletionError={deletionError}
        deletionErrorData={deletionErrorData}
        setDeletionErrorData={setDeletionErrorData}
        crOrga={crOrga}
        canEditSelfRole={canEditSelfRole(user.role)}
        canBeUntrainedRole={canBeUntrainedRole(user.role, user.environment)}
        changeRole={changeRole}
        setDeletingMember={setDeletingMember}
        deletingMember={deletingMember}
      />
    </>
  )
}

export default TeamTable
