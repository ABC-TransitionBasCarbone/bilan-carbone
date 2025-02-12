'use client'

import Block from '@/components/base/Block'
import HelpIcon from '@/components/base/HelpIcon'
import Modal from '@/components/modals/Modal'
import { FullStudy } from '@/db/study'
import { isAdminOnStudyOrga } from '@/services/permissions/study'
import { StudyRole } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import SelectStudyRole from './SelectStudyRole'
import styles from './StudyRights.module.css'

interface Props {
  user: User
  study: FullStudy
  userRoleOnStudy?: StudyRole
}

const StudyRightsTable = ({ user, study, userRoleOnStudy }: Props) => {
  const t = useTranslations('study.rights.table')
  const tStudyRole = useTranslations('study.role')
  const [displayRoles, setDisplayRoles] = useState(false)

  const columns = useMemo(() => {
    const columns: ColumnDef<FullStudy['allowedUsers'][0]>[] = [
      {
        header: t('email'),
        accessorKey: 'user.email',
      },
    ]
    if (isAdminOnStudyOrga(user, study) || userRoleOnStudy !== StudyRole.Reader) {
      columns.push({
        header: t('role'),
        accessorKey: 'role',
        cell: (context) => {
          const role = context.getValue() as StudyRole
          return (
            <SelectStudyRole
              user={user}
              userRole={userRoleOnStudy}
              currentRole={role}
              rowUser={context.row.original.user}
              studyId={study.id}
              studyLevel={study.level}
              studyOrganizationId={study.organizationId}
            />
          )
        },
      })
    } else {
      columns.push({
        header: t('role'),
        accessorFn: (right: FullStudy['allowedUsers'][0]) => tStudyRole(right.role),
      })
    }
    return columns
  }, [t, tStudyRole, userRoleOnStudy, user, study])

  const table = useReactTable({
    columns,
    data: study.allowedUsers,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <Block
        title={t('title')}
        icon={
          <HelpIcon
            className={styles.helpIcon}
            onClick={() => setDisplayRoles(!displayRoles)}
            label={tStudyRole('guide')}
          />
        }
        expIcon
        actions={
          isAdminOnStudyOrga(user, study) || userRoleOnStudy !== StudyRole.Reader
            ? [
                {
                  actionType: 'link',
                  href: `/etudes/${study.id}/cadrage/ajouter`,
                  'data-testid': 'study-rights-change-button',
                  children: t('newRightLink'),
                },
              ]
            : undefined
        }
      >
        <table aria-labelledby="study-rights-table-title">
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
      <Modal
        open={displayRoles}
        label="study-roles"
        title={tStudyRole('guide')}
        onClose={() => setDisplayRoles(false)}
        actions={[{ actionType: 'button', onClick: () => setDisplayRoles(false), children: tStudyRole('close') }]}
      >
        {Object.keys(StudyRole).map((role) => (
          <p key={role} className="mb-2">
            <b>{tStudyRole(role)} :</b> {tStudyRole(`${role}_description`)}
          </p>
        ))}
      </Modal>
    </>
  )
}

export default StudyRightsTable
