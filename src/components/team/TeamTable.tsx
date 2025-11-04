'use client'

import HelpIcon from '@/components/base/HelpIcon'
import BaseTable from '@/components/base/Table'
import { TeamMember } from '@/db/account'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteOrganizationMember } from '@/services/serverFunctions/organization'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { canEditMemberRole, getEnvironmentRoles } from '@/utils/user'
import { Environment, Role } from '@prisma/client'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import Block from '../base/Block'
import { TableActionButton } from '../base/TableActionButton'
import Modal from '../modals/Modal'
import SelectRole from './SelectRole'
import styles from './TeamTable.module.css'

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
  const t = useTranslations('team.table')
  const tLevel = useTranslations('level')
  const tRole = useTranslations('role')
  const [displayRoles, setDisplayRoles] = useState(false)
  const [deletingMember, setDeletingMember] = useState('')
  const [deletionError, setDeletionError] = useState('')
  const [deletionErrorData, setDeletionErrorData] = useState<DeletionErrorData[] | undefined>(undefined)
  const canUpdateTeam = canEditMemberRole(user)
  const { callServerFunction } = useServerFunction()

  const router = useRouter()

  const { environment } = useAppEnvironmentStore()
  const isCut = useMemo(() => environment === Environment.CUT, [environment])

  const columns = useMemo(() => {
    const col: ColumnDef<TeamMember>[] = [
      {
        header: t('firstName'),
        accessorKey: 'user.firstName',
      },
      { header: t('lastName'), accessorKey: 'user.lastName' },
      { header: t('email'), accessorKey: 'user.email' },
    ]

    if (!isCut) {
      col.push({
        header: t('level'),
        accessorFn: (member: TeamMember) => (member.user.level ? tLevel(member.user.level) : ''),
      })
    }

    col.push({
      header: t('role'),
      accessorKey: 'role',
      cell: ({ getValue, row }) => {
        const role = getValue() as Role
        return canUpdateTeam ? (
          <SelectRole
            currentUserEmail={user.email}
            currentRole={role}
            email={row.original.user.email}
            level={row.original.user.level}
            environment={user.environment}
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
          return row.original.user.email !== user.email ? (
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
  }, [t, isCut, canUpdateTeam, tLevel, user.email, user.environment, tRole])

  const table = useReactTable({
    columns,
    data: team,
    getCoreRowModel: getCoreRowModel(),
  })

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
            children: tRole('close'),
          },
        ]}
      >
        {Object.keys(getEnvironmentRoles(user.environment))
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
            children: t('close'),
          },
          {
            actionType: 'button',
            ['data-testid']: 'delete-member-validation',
            onClick: deleteMember,
            children: t('confirm'),
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

export default TeamTable
