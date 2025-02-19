'use client'
import HelpIcon from '@/components/base/HelpIcon'
import { TeamMember } from '@/db/user'
import { isAdmin } from '@/services/permissions/user'
import { Role } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import Block from '../base/Block'
import Modal from '../modals/Modal'
import SelectRole from './SelectRole'

interface Props {
  user: User
  team: TeamMember[]
  crOrga: boolean
}

const TeamTable = ({ user, team, crOrga }: Props) => {
  const t = useTranslations('team.table')
  const tLevel = useTranslations('level')
  const tRole = useTranslations('role')
  const [displayRoles, setDisplayRoles] = useState(false)

  const columns = useMemo(() => {
    const columns: ColumnDef<TeamMember>[] = [
      {
        header: t('firstName'),
        accessorKey: 'firstName',
      },
      { header: t('lastName'), accessorKey: 'lastName' },
      { header: t('email'), accessorKey: 'email' },
      { header: t('level'), accessorFn: (member: TeamMember) => tLevel(member.level) },
    ]
    if (isAdmin(user.role) || user.role === Role.GESTIONNAIRE) {
      columns.push({
        header: t('role'),
        accessorKey: 'role',
        cell: (context) => {
          const role = context.getValue() as Role
          return <SelectRole user={user} currentRole={role} email={context.row.original.email} />
        },
      })
    }
    return columns
  }, [t, tLevel, tRole, user])

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
          user.role !== Role.DEFAULT
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
