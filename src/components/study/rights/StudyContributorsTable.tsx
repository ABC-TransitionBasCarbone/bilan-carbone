// TO DELETE ts-nockeck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client'

import Block from '@/components/base/Block'
import HelpIcon from '@/components/base/HelpIcon'
import Toast, { ToastColors } from '@/components/base/Toast'
import Modal from '@/components/modals/Modal'
import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { deleteStudyContributor } from '@/services/serverFunctions/study'
import DeleteIcon from '@mui/icons-material/Cancel'
import { Button } from '@mui/material'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

interface Props {
  study: FullStudy
  canAddContributor: boolean
}

export interface StudyContributorRow {
  email: string
  post: string
  subPosts: string[]
  accountId: string
}

const emptyToast = { text: '', color: 'error' } as const
const toastPosition = { vertical: 'bottom', horizontal: 'left' } as const

const faq = process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''

const allPosts = Object.values(Post)
const StudyContributorsTable = ({ study, canAddContributor }: Props) => {
  const t = useTranslations('study.rights.contributorsTable')
  const tDeleting = useTranslations('study.rights.contributorsTable.deleting')
  const tRole = useTranslations('study.rights.contributorsTable.role')
  const tPost = useTranslations('emissionFactors.post')
  const [displayRoles, setDisplayRoles] = useState(false)
  const [toast, setToast] = useState<{ text: string; color: ToastColors }>(emptyToast)
  const [contributorToDelete, setToDelete] = useState<StudyContributorRow | undefined>(undefined)
  const [deleting, setDeleting] = useState(false)

  const router = useRouter()

  // Complexe method to simplify the display on the table...
  const data = useMemo(
    () =>
      study.contributors
        .filter(
          (contributor, index) =>
            study.contributors.findIndex((value) => value.account.user.email === contributor.account.user.email) ===
            index,
        )
        .map((contributor) => ({ accountId: contributor.accountId, email: contributor.account.user.email }))
        .map((contributor) => ({
          ...contributor,
          subPosts: study.contributors
            .filter((studyContributor) => studyContributor.accountId === contributor.accountId)
            .map((studyContributor) => studyContributor.subPost),
        }))
        .map(({ subPosts, ...contributor }) => ({
          ...contributor,
          posts: allPosts
            .map((post) => ({
              post,
              subPosts: subPostsByPost[post].filter((subPost) => subPosts.includes(subPost)),
            }))
            .filter(({ subPosts }) => subPosts.length > 0),
        }))
        .flatMap(({ posts, ...contributor }) =>
          posts.length === allPosts.length
            ? [{ ...contributor, post: 'allPost', subPosts: ['allSubPost'] }]
            : posts.map(({ post, subPosts }) => ({
                ...contributor,
                post,
                subPosts: subPosts.length === subPostsByPost[post].length ? ['allSubPost'] : subPosts,
              })),
        ),
    [study],
  )

  const columns = useMemo(() => {
    const columns: ColumnDef<StudyContributorRow>[] = [
      {
        header: t('email'),
        accessorKey: 'email',
      },
      {
        header: t('post'),
        accessorFn: ({ post }) => tPost(post),
      },
      {
        header: t('subPosts'),
        accessorFn: ({ subPosts }) => subPosts.map((subPost) => tPost(subPost)).join(', '),
      },
    ]
    return canAddContributor
      ? columns.concat([
          {
            header: t('actions'),
            cell: ({ row }) => (
              <div className="flex-cc">
                <Button
                  aria-label={t('delete')}
                  title={t('delete')}
                  onClick={() => setToDelete(row.original)}
                  data-testid={`delete-study-contributor-button`}
                >
                  <DeleteIcon color="error" />
                </Button>
              </div>
            ),
          },
        ])
      : columns
  }, [canAddContributor])

  const table = useReactTable({
    columns,
    getRowId: (row) => row.email + row.post,
    data,
    getCoreRowModel: getCoreRowModel(),
  })

  const deleteContributor = async (contributor: StudyContributorRow) => {
    setDeleting(true)
    const result = await deleteStudyContributor(contributor, study.id)
    setDeleting(false)
    setToDelete(undefined)
    if (result) {
      setToast({ text: result, color: 'error' })
    } else {
      router.refresh()
    }
  }

  return (
    <>
      <Block
        title={t('title')}
        icon={<HelpIcon onClick={() => setDisplayRoles(!displayRoles)} label={tRole('information')} />}
        expIcon
        iconPosition="after"
        actions={
          canAddContributor
            ? [
                {
                  actionType: 'link',
                  href: `/etudes/${study.id}/cadrage/ajouter-contributeur`,
                  'data-testid': 'study-rights-add-contributor',
                  children: t('newContributorLink'),
                },
              ]
            : undefined
        }
      >
        <table aria-labelledby="study-rights-table-title" className="mb2">
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
              <tr key={row.id} data-testid="study-contributors-table-line">
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
        label="study-contributor"
        title={tRole('information')}
        onClose={() => setDisplayRoles(false)}
        actions={[{ actionType: 'button', onClick: () => setDisplayRoles(false), children: tRole('close') }]}
      >
        <p className="mb-2">
          {tRole.rich('description', {
            link: (children) => (
              <Link href={faq} target="_blank" rel="noreferrer noopener">
                {children}
              </Link>
            ),
          })}
        </p>
      </Modal>
      {contributorToDelete && (
        <Modal
          open
          label="study-contributor-deletion"
          title={tDeleting('title')}
          onClose={() => setToDelete(undefined)}
          actions={[
            {
              actionType: 'button',
              color: 'secondary',
              onClick: () => setToDelete(undefined),
              children: tDeleting('no'),
              ['data-testid']: 'study-contributor-cancel-deletion',
            },
            {
              actionType: 'loadingButton',
              onClick: () => deleteContributor(contributorToDelete),
              children: tDeleting('yes'),
              loading: deleting,
              ['data-testid']: 'study-contributor-confirm-deletion',
            },
          ]}
        >
          {tDeleting('confirmation', { email: contributorToDelete.email })}
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

export default StudyContributorsTable
