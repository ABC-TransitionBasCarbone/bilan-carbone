'use client'

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'
import styles from './StudyRightsTable.module.css'
import { Role, StudyRole } from '@prisma/client'
import { StudyWithRights } from '@/db/study'
import Block from '@/components/base/Block'
import LinkButton from '@/components/base/LinkButton'
import SelectStudyRole from './SelectStudyRole'
import StudyPublicStatus from './StudyPublicStatus'

interface Props {
  user: User
  study: StudyWithRights
}

const StudyRightsTable = ({ user, study }: Props) => {
  const t = useTranslations('study.rights.table')
  const tStudyRole = useTranslations('study.role')

  const userRoleOnStudy = useMemo(() => {
    return study.allowedUsers.find((right) => right.user.email === user.email)
  }, [user, study])

  const columns = useMemo(() => {
    const columns: ColumnDef<StudyWithRights['allowedUsers'][0]>[] = [
      {
        header: t('email'),
        accessorKey: 'user.email',
      },
    ]
    if (user.role === Role.ADMIN || (userRoleOnStudy && userRoleOnStudy.role !== StudyRole.Reader)) {
      columns.push({
        header: t('role'),
        accessorKey: 'role',
        cell: (context) => {
          const role = context.getValue() as StudyRole
          return (
            <SelectStudyRole
              user={user}
              userRole={userRoleOnStudy?.role}
              currentRole={role}
              email={context.row.original.user.email}
              studyId={study.id}
            />
          )
        },
      })
    } else {
      columns.push({
        header: t('role'),
        accessorFn: (right: StudyWithRights['allowedUsers'][0]) => tStudyRole(right.role),
      })
    }
    return columns
  }, [t, tStudyRole, userRoleOnStudy, user])

  const table = useReactTable({
    columns,
    data: study.allowedUsers,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Block>
      <div className="align-center justify-between pb2">
        <h1 id="study-rights-table-title">{t('title', { name: study.name })}</h1>
        {(user.role === Role.ADMIN || (userRoleOnStudy && userRoleOnStudy.role !== StudyRole.Reader)) && (
          <LinkButton href={`/etudes/${study.id}/droits/ajouter`} data-testid="study-rights-change-button">
            {t('new-right')}
          </LinkButton>
        )}
      </div>
      <StudyPublicStatus user={user} userRoleOnStudy={userRoleOnStudy} study={study} />
      <table className={styles.table} aria-labelledby="study-rights-table-title">
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
            <tr key={row.id} data-testid="study-rights-table-line">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Block>
  )
}

export default StudyRightsTable
