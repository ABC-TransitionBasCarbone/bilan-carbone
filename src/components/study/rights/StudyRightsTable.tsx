'use client'

import Block from '@/components/base/Block'
import HelpIcon from '@/components/base/HelpIcon'
import Toast, { ToastColors } from '@/components/base/Toast'
import Modal from '@/components/modals/Modal'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteStudyMember } from '@/services/serverFunctions/study'
import DeleteIcon from '@mui/icons-material/Cancel'
import { Button } from '@mui/material'
import { StudyRole } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import SelectStudyRole from './SelectStudyRole'

interface Props {
  user: UserSession
  study: FullStudy
  canAddMember: boolean
  userRoleOnStudy: StudyRole
}

const emptyToast = { text: '', color: 'error' } as const
const toastPosition = { vertical: 'bottom', horizontal: 'left' } as const

const StudyRightsTable = ({ user, study, canAddMember, userRoleOnStudy }: Props) => {
  const t = useTranslations('study.rights.table')
  const tDeleting = useTranslations('study.rights.table.deleting')
  const tStudyRole = useTranslations('study.role')
  const [displayRoles, setDisplayRoles] = useState(false)
  const [toast, setToast] = useState<{ text: string; color: ToastColors }>(emptyToast)
  const [memberToDelete, setToDelete] = useState<FullStudy['allowedUsers'][0] | undefined>(undefined)
  const [deleting, setDeleting] = useState(false)
  const { callServerFunction } = useServerFunction()

  const router = useRouter()

  const columns = useMemo(() => {
    const columns: ColumnDef<FullStudy['allowedUsers'][0]>[] = [
      {
        header: t('email'),
        accessorKey: 'account.user.email',
      },
    ]
    if (canAddMember) {
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
              rowUser={context.row.original.account}
              study={study}
            />
          )
        },
      })
      columns.push({
        header: t('actions'),
        cell: ({ row }) =>
          user.accountId !== row.original.accountId && (
            <div className="flex-cc">
              <Button
                aria-label={t('delete')}
                title={t('delete')}
                onClick={() => setToDelete(row.original)}
                data-testid={`delete-study-member-button`}
              >
                <DeleteIcon />
              </Button>
            </div>
          ),
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

  const deleteMember = async (member: FullStudy['allowedUsers'][0]) => {
    setDeleting(true)
    await callServerFunction(() => deleteStudyMember(member, study.id), {
      onSuccess: () => {
        router.refresh()
      },
    })
    setDeleting(false)
    setToDelete(undefined)
  }

  return (
    <>
      <Block
        title={t('title')}
        icon={<HelpIcon onClick={() => setDisplayRoles(!displayRoles)} label={tStudyRole('guide')} />}
        iconPosition="after"
        expIcon
        actions={
          canAddMember
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
        <span className="block mb-2">{tStudyRole('introduction')}</span>
        {Object.keys(StudyRole).map((role) => (
          <span key={role} className="block mb-2">
            <b>{tStudyRole(role)} :</b> {tStudyRole(`${role}_description`)}
          </span>
        ))}
      </Modal>
      {memberToDelete && (
        <Modal
          open
          label="study-member-deletion"
          title={tDeleting('title')}
          onClose={() => setToDelete(undefined)}
          actions={[
            {
              actionType: 'button',
              color: 'secondary',
              onClick: () => setToDelete(undefined),
              children: tDeleting('no'),
              ['data-testid']: 'study-member-cancel-deletion',
            },
            {
              actionType: 'loadingButton',
              onClick: () => deleteMember(memberToDelete),
              children: tDeleting('yes'),
              loading: deleting,
              ['data-testid']: 'study-member-confirm-deletion',
            },
          ]}
        >
          {tDeleting('confirmation', { email: memberToDelete.account.user.email })}
        </Modal>
      )}
      {toast.text && (
        <Toast
          position={toastPosition}
          onClose={() => setToast(emptyToast)}
          message={tDeleting(toast.text)}
          color={toast.color}
          toastKey="delete-contributor-toast"
          open
        />
      )}
    </>
  )
}

export default StudyRightsTable
