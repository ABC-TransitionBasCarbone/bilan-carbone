'use client'

import { Table as BaseTable, HelpIcon } from '@abc-transitionbascarbone/components'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { TableActionButton } from '@abc-transitionbascarbone/components/src/base/TableActionButton'
import Modal from '@abc-transitionbascarbone/components/src/modals/Modal'
import { Level, Role } from '@abc-transitionbascarbone/db-common/enums'
import { ApiResponse } from '@abc-transitionbascarbone/utils/serverResponse'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'
import SelectRoleCommon from './SelectRoleCommon'
import styles from './TeamTableCommon.module.css'

export type TeamMemberCommon = {
  user: {
    email: string
    firstName: string
    lastName: string
    level: Level | null
  }
  formationName?: string | null
  role: Role
  updatedAt: Date
}

interface Props {
  email: string
  team: TeamMemberCommon[]
  canUpdateTeam: boolean
  environmentRoles:
    | Role
    | {
        ADMIN: 'ADMIN'
        DEFAULT: 'DEFAULT'
      }
    | {
        ADMIN: 'ADMIN'
        COLLABORATOR: 'COLLABORATOR'
      }
  deleteMember: () => Promise<void>
  isAdvanced?: boolean
  deletionError: string
  setDeletionErrorData: (data: DeletionErrorData[] | undefined) => void
  changeRole: (email: string, newRole: Role) => Promise<ApiResponse>

  deletionErrorData?: DeletionErrorData[]
  crOrga?: boolean
  canEditSelfRole?: boolean
  canBeUntrainedRole?: boolean
  setDeletingMember: (value: string) => void
  deletingMember: string
}

type DeletionErrorData = {
  id: string
  name: string
  organization: string
}

const TeamTableCommon = ({
  email,
  team,
  canUpdateTeam,
  environmentRoles,
  deleteMember,
  isAdvanced,
  deletionError,
  deletionErrorData,
  setDeletionErrorData,
  crOrga,
  canEditSelfRole,
  canBeUntrainedRole,
  changeRole,
  setDeletingMember,
  deletingMember,
}: Props) => {
  const t = useTranslations('team.table')
  const tAction = useTranslations('common.action')
  const tLevel = useTranslations('level')
  const tRole = useTranslations('role')
  const [displayRoles, setDisplayRoles] = useState(false)

  const columns = useMemo(() => {
    const col: ColumnDef<TeamMemberCommon>[] = [
      {
        header: t('firstName'),
        accessorKey: 'user.firstName',
      },
      { header: t('lastName'), accessorKey: 'user.lastName' },
      { header: t('email'), accessorKey: 'user.email' },
    ]

    if (isAdvanced) {
      col.push({
        header: t('level'),
        accessorFn: (member: TeamMemberCommon) =>
          member.formationName ? member.formationName : tLevel(member.user.level ? member.user.level : 'noLevel'),
      })
    }

    col.push({
      header: t('role'),
      accessorKey: 'role',
      cell: ({ getValue, row }) => {
        const role = getValue() as Role
        return canUpdateTeam ? (
          <SelectRoleCommon
            currentUserEmail={email}
            currentRole={role}
            email={row.original.user.email}
            level={row.original.user.level}
            environmentRoles={environmentRoles}
            canEditSelfRole={canEditSelfRole}
            canBeUntrainedRole={canBeUntrainedRole}
            changeRole={changeRole}
          />
        ) : (
          <>{tRole(role)}</>
        )
      },
    })

    if (canUpdateTeam) {
      col.push({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          return row.original.user.email !== email ? (
            <TableActionButton
              type="delete"
              onClick={() => setDeletingMember(row.original.user.email)}
              data-testid="delete-member-button"
            />
          ) : null
        },
      })
    }
    return col
  }, [t, canUpdateTeam, tLevel, email, tRole])

  const table = useReactTable({
    columns,
    data: team,
    getCoreRowModel: getCoreRowModel(),
  })

  const onClose = useCallback(() => {
    setDeletingMember('')
    setDeletionErrorData(undefined)
  }, [setDeletingMember, setDeletionErrorData])

  return (
    <>
      <Block
        title={t('title')}
        icon={<HelpIcon onClick={() => setDisplayRoles(!displayRoles)} label={tRole('guide')} />}
        iconPosition="after"
        expIcon
        id="team-table-title"
        actions={
          canUpdateTeam
            ? [
                {
                  actionType: 'link',
                  href: '/equipe/ajouter',
                  'data-testid': 'add-member-link',
                  children: t('newUser'),
                },
              ]
            : undefined
        }
      >
        <BaseTable table={table} testId="team" />
      </Block>
      <Modal
        open={displayRoles}
        label="organization-roles"
        title={tRole('guide')}
        onClose={() => setDisplayRoles(false)}
        actions={[
          {
            actionType: 'button',
            ['data-testid']: 'organization-roles-cancel',
            onClick: () => setDisplayRoles(false),
            children: tAction('cancel'),
          },
        ]}
      >
        {Object.keys(environmentRoles)
          .filter((role) => role !== Role.SUPER_ADMIN)
          .map((role) => (
            <p key={role} className="mb-2">
              <b>{tRole(role)} :</b> {tRole(`${role}_description${crOrga ? '_CR' : ''}`)}
            </p>
          ))}
      </Modal>
      <Modal
        open={!!deletingMember}
        label="member-deletion"
        title={t('userDeletion')}
        onClose={onClose}
        actions={[
          {
            actionType: 'button',
            ['data-testid']: 'delete-member-cancel',
            onClick: onClose,
            className: 'secondary',
            children: tAction('cancel'),
          },
          {
            actionType: 'button',
            ['data-testid']: 'delete-member-validation',
            onClick: deleteMember,
            children: tAction('confirm'),
            disabled: !!deletionErrorData,
          },
        ]}
      >
        {t('userDeletionDescription')}
        {deletionErrorData && (
          <div className="error mt1">
            <span>{t(deletionError)}</span>
            <ul className={styles.studiesList}>
              {deletionErrorData?.map((study) => (
                <li key={study.id}>
                  <a href={`/etudes/${study.id}`}>{study.name}</a> ({study.organization})
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </>
  )
}

export default TeamTableCommon
