'use client'

import { TeamMember } from '@/db/user'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'
import styles from './TeamTable.module.css'
import { Role } from '@prisma/client'
import SelectRole from './SelectRole'

interface Props {
  user: User
  team: TeamMember[]
}

const TeamTable = ({ user, team }: Props) => {
  const t = useTranslations('team.table')
  const tLevel = useTranslations('level')

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
    switch (user.role) {
      case Role.SUPER_ADMIN:
      case Role.ADMIN:
        columns.push({
          header: t('role'),
          accessorKey: 'role',
          cell: (context) => {
            const role = context.getValue() as Role
            return <SelectRole user={user} currentRole={role} email={context.row.original.email} />
          },
        })
        break
      case Role.GESTIONNAIRE:
        columns.push({ header: t('role'), accessorKey: 'role' })
        break
    }
    return columns
  }, [t, tLevel, user])

  const table = useReactTable({
    columns,
    data: team,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <h2 id="team-table-title">{t('title')}</h2>
      <table className={styles.table} aria-labelledby="team-table-title">
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
    </>
  )
}

export default TeamTable
