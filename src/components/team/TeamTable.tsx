'use client'

import HelpIcon from '@/components/base/HelpIcon'
import { TeamMember } from '@/db/account'
import { deleteOrganizationMember } from '@/services/serverFunctions/organization'
import { canEditMemberRole } from '@/utils/organization'
import { getEnvironmentRoles } from '@/utils/user'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { Role } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import Block from '../base/Block'
import Button from '../base/Button'
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

  const router = useRouter()

  const columns = useMemo(() => {
    const col: ColumnDef<TeamMember>[] = [
      {
        header: t('firstName'),
        accessorKey: 'user.firstName',
      },
      { header: t('lastName'), accessorKey: 'user.lastName' },
      { header: t('email'), accessorKey: 'user.email' },
      { header: t('level'), accessorFn: (member: TeamMember) => (member.user.level ? tLevel(member.user.level) : '') },
      {
        header: t('role'),
        accessorKey: 'role',
        cell: (context) => {
          const role = context.getValue() as Role
          return canUpdateTeam ? (
            <SelectRole
              currentUserEmail={user.email}
              currentRole={role}
              email={context.row.original.user.email}
              level={context.row.original.user.level}
            />
          ) : (
            <>{tRole(role)}</>
          )
        },
      },
    ]
    if (canUpdateTeam) {
      col.push({
        header: t('action'),
        cell: ({ row }) =>
          row.original.user.email !== user.email ? (
            <div className="justify-center">
              <Button onClick={() => setDeletingMember(row.original.user.email)} title={t('deleteMember')}>
                <DeleteOutlineIcon />
              </Button>
            </div>
          ) : (
            <></>
          ),
      })
    }
    return col
  }, [t, user])

  const table = useReactTable({
    columns,
    data: team,
    getCoreRowModel: getCoreRowModel(),
  })

  const deleteMember = async () => {
    setDeletionError('')
    setDeletionErrorData(undefined)
    const result = await deleteOrganizationMember(deletingMember)
    if (!result.success) {
      setDeletionError(result.errorMessage)
    } else if (result.data) {
      setDeletionError(result.data.code)
      setDeletionErrorData(
        result.data.studies.map((study) => ({
          id: study.id,
          name: study.name,
          organization: study.organizationVersion.organization.name,
        })),
      )
    } else {
      setDeletingMember('')
      router.refresh()
    }
  }

  const onClose = () => {
    setDeletingMember('')
    setDeletionError('')
    setDeletionErrorData(undefined)
  }

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
        <table aria-labelledby="team-table-title">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} data-testid="team-table-line">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
        {Object.keys(getEnvironmentRoles())
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
            disabled: !!deletionError,
          },
        ]}
      >
        {t('userDeletionDescription')}
        {deletionError && (
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
