'use client'
import HelpIcon from '@/components/base/HelpIcon'
import { TeamMember } from '@/db/account'
import { canEditMemberRole } from '@/utils/organization'
import { Role } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import Block from '../base/Block'
import Modal from '../modals/Modal'
import SelectRole from './SelectRole'

interface Props {
  user: UserSession
  team: TeamMember[]
  crOrga: boolean
}

const TeamTable = ({ user, team, crOrga }: Props) => {
  const t = useTranslations('team.table')
  const tLevel = useTranslations('level')
  const tRole = useTranslations('role')
  const [displayRoles, setDisplayRoles] = useState(false)
  const canUpdateTeam = canEditMemberRole(user)

  const columns: ColumnDef<TeamMember>[] = useMemo(
    () => [
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
    ],
    [t, user],
  )

  const table = useReactTable({
    columns,
    data: team,
    getCoreRowModel: getCoreRowModel(),
  })

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
        {Object.keys(Role)
          .filter((role) => role !== Role.SUPER_ADMIN)
          .map((role) => (
            <p key={role} className="mb-2">
              <b>{tRole(role)} :</b> {tRole(`${role}_description${crOrga ? '_CR' : ''}`)}
            </p>
          ))}
      </Modal>
    </>
  )
}

export default TeamTable
