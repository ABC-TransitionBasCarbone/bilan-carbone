'use client'

import Block from '@/components/base/Block'
import HelpIcon from '@/components/base/HelpIcon'
import Modal from '@/components/modals/Modal'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { BCPost, Post, subPostsByPost } from '@/services/posts'
import { deleteStudyContributor } from '@/services/serverFunctions/study'
import DeleteIcon from '@mui/icons-material/Cancel'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Button, IconButton } from '@mui/material'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import styles from './StudyContributorsTable.module.css'

interface Props {
  study: FullStudy
  canAddContributor: boolean
}

export interface StudyContributorDeleteParams {
  accountId: string
  post: string
  subPosts: string[]
}

export type StudyContributorTableRow =
  | {
      type: 'parent'
      email: string
      accountId: string
      posts: {
        post: string
        subPosts: string[]
      }[]
      hasAllPosts?: boolean // Flag to indicate if user has access to all posts
    }
  | {
      type: 'child'
      email: string
      accountId: string
      post: string
      subPosts: string[]
    }

const faq = process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''
const PREVIEW_MAX_LINES = 2
const SUBPOST_PREVIEW_LIMIT = 3

const StudyContributorsTable = ({ study, canAddContributor }: Props) => {
  const t = useTranslations('study.rights.contributorsTable')
  const tDeleting = useTranslations('study.rights.contributorsTable.deleting')
  const tRole = useTranslations('study.rights.contributorsTable.role')
  const tPost = useTranslations('emissionFactors.post')
  const [displayRoles, setDisplayRoles] = useState(false)
  const [contributorToDelete, setToDelete] = useState<StudyContributorTableRow | undefined>(undefined)
  const [deleting, setDeleting] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const { callServerFunction } = useServerFunction()

  const router = useRouter()

  const allPosts = useMemo(() => Object.values(BCPost), [])

  const toggleRowExpansion = useCallback((email: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(email)) {
        newSet.delete(email)
      } else {
        newSet.add(email)
      }
      return newSet
    })
  }, [])

  const ExpandableCell = useCallback(
    ({ email, children, className = '' }: { email: string; children: React.ReactNode; className?: string }) => (
      <div className={`${styles.expandable} align-center ${className}`} onClick={() => toggleRowExpansion(email)}>
        {children}
      </div>
    ),
    [toggleRowExpansion],
  )

  const getActualSubPosts = useCallback((posts: { post: string; subPosts: string[] }[]) => {
    return posts.flatMap((postData) =>
      postData.subPosts[0] === 'allSubPost' ? subPostsByPost[postData.post as Post] : postData.subPosts,
    )
  }, [])

  const generatePostPreview = useCallback(
    (posts: { post: string; subPosts: string[] }[], maxLines = 2, hasAllPosts = false) => {
      if (hasAllPosts) {
        return tPost('allPost')
      }

      const postLabels = posts.map((p) => tPost(p.post))
      const visiblePosts = postLabels.slice(0, maxLines)
      const hasMore = postLabels.length > maxLines
      const remainingPosts = postLabels.length - visiblePosts.length

      return `${visiblePosts.join(', ')}${hasMore ? ` ${t('andXOthers', { count: remainingPosts })}` : ''}`
    },
    [t, tPost],
  )

  const generateSubPostPreview = useCallback(
    (posts: { post: string; subPosts: string[] }[], hasAllPosts = false) => {
      if (hasAllPosts) {
        return tPost('allSubPost')
      }

      const actualSubPosts = getActualSubPosts(posts)
      const allPossibleSubPosts = posts.flatMap((p) => subPostsByPost[p.post as Post])

      // Check if contributor has access to ALL possible sub-posts
      const hasAllSubPosts = allPossibleSubPosts.every((sp) => actualSubPosts.includes(sp))

      if (hasAllSubPosts) {
        return tPost('allSubPost')
      }

      const visibleSubPosts = actualSubPosts.slice(0, SUBPOST_PREVIEW_LIMIT).map((sp) => tPost(sp))
      const hasMore = actualSubPosts.length > SUBPOST_PREVIEW_LIMIT
      const suffix = hasMore ? ` ${t('andXOthers', { count: actualSubPosts.length - SUBPOST_PREVIEW_LIMIT })}` : ''

      return `${visibleSubPosts.join(', ')}${suffix}`
    },
    [tPost, t, getActualSubPosts],
  )

  const renderEmailCell = useCallback(
    (rowData: StudyContributorTableRow) => {
      if (rowData.type === 'parent') {
        const isExpanded = expandedRows.has(rowData.email)
        return (
          <ExpandableCell email={rowData.email}>
            <div className="align-center">
              <IconButton size="small" className={styles.iconButton} aria-label={isExpanded ? 'Collapse' : 'Expand'}>
                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
              <span>{rowData.email}</span>
            </div>
          </ExpandableCell>
        )
      }
      return <div className={styles.childRowContent}>{/* Empty for sub-rows */}</div>
    },
    [expandedRows, ExpandableCell],
  )

  const renderPostCell = useCallback(
    (rowData: StudyContributorTableRow) => {
      if (rowData.type === 'parent') {
        const preview = generatePostPreview(rowData.posts, PREVIEW_MAX_LINES, rowData.hasAllPosts)

        return (
          <ExpandableCell email={rowData.email}>
            <div>{preview}</div>
          </ExpandableCell>
        )
      }
      return <span>{tPost(rowData.post)}</span>
    },
    [generatePostPreview, ExpandableCell, tPost],
  )

  const renderSubPostCell = useCallback(
    (rowData: StudyContributorTableRow) => {
      if (rowData.type === 'parent') {
        const subPostPreview = generateSubPostPreview(rowData.posts, rowData.hasAllPosts)

        return (
          <ExpandableCell email={rowData.email}>
            <div>{subPostPreview}</div>
          </ExpandableCell>
        )
      }

      if (rowData.subPosts.length === 1 && rowData.subPosts[0] === 'allSubPost') {
        return <span>{tPost('allSubPost')}</span>
      }
      return <span>{rowData.subPosts.map((subPost) => tPost(subPost)).join(', ')}</span>
    },
    [generateSubPostPreview, ExpandableCell, tPost],
  )

  // Create flattened data structure with contributor rows and expandable post sub-rows
  const data = useMemo(() => {
    const contributorData = study.contributors
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
      .map(({ subPosts, ...contributor }) => {
        const posts = allPosts
          .map((post) => ({
            post,
            subPosts: subPostsByPost[post].filter((subPost) => subPosts.includes(subPost)),
          }))
          .filter(({ subPosts }) => subPosts.length > 0)
          .map(({ post, subPosts }) => ({
            post,
            subPosts: subPosts.length === subPostsByPost[post].length ? ['allSubPost'] : subPosts,
          }))

        // Check if contributor has access to all posts AND all sub-posts
        const allPossibleSubPosts = allPosts.flatMap((post) => subPostsByPost[post])
        const contributorSubPosts = posts.flatMap(({ post, subPosts }) =>
          subPosts[0] === 'allSubPost' ? subPostsByPost[post] : subPosts,
        )
        const hasAllPosts =
          posts.length === allPosts.length &&
          allPossibleSubPosts.every((subPost) => contributorSubPosts.includes(subPost))

        return {
          type: 'parent' as const,
          ...contributor,
          posts,
          hasAllPosts,
        }
      })

    const flattenedData: StudyContributorTableRow[] = []

    contributorData.forEach((contributor) => {
      flattenedData.push(contributor)

      if (expandedRows.has(contributor.email)) {
        contributor.posts.forEach((postData) => {
          flattenedData.push({
            type: 'child' as const,
            email: contributor.email,
            accountId: contributor.accountId,
            post: postData.post,
            subPosts: postData.subPosts,
          })
        })
      }
    })

    return flattenedData
  }, [study.contributors, allPosts, expandedRows])

  const columns = useMemo(() => {
    const columns: ColumnDef<StudyContributorTableRow>[] = [
      {
        header: t('email'),
        cell: ({ row }) => renderEmailCell(row.original),
      },
      {
        header: t('post'),
        cell: ({ row }) => renderPostCell(row.original),
      },
      {
        header: t('subPosts'),
        cell: ({ row }) => renderSubPostCell(row.original),
      },
    ]

    return canAddContributor
      ? columns.concat([
          {
            header: t('actions'),
            cell: ({ row }) => {
              const rowData = row.original

              if (rowData.type === 'parent') {
                // Delete entire contributor
                return (
                  <div className="flex-cc">
                    <Button
                      aria-label={t('delete')}
                      title={t('delete')}
                      onClick={() => setToDelete(rowData)}
                      data-testid={`delete-study-contributor-button`}
                      color="error"
                    >
                      <DeleteIcon />
                    </Button>
                  </div>
                )
              } else {
                // Delete specific post assignment
                return (
                  <div className="flex-cc">
                    <Button
                      aria-label={t('delete')}
                      title={`Delete ${tPost(rowData.post)}`}
                      onClick={() => setToDelete(rowData)}
                      data-testid={`delete-study-contributor-post-button`}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </Button>
                  </div>
                )
              }
            },
          },
        ])
      : columns
  }, [canAddContributor, t, tPost, renderEmailCell, renderPostCell, renderSubPostCell])

  const table = useReactTable({
    columns,
    getRowId: (row) => {
      if (row.type === 'parent') {
        return `parent-${row.email}`
      } else {
        return `child-${row.email}-${row.post}`
      }
    },
    data,
    getCoreRowModel: getCoreRowModel(),
  })

  const deleteContributor = async (contributor: StudyContributorTableRow) => {
    setDeleting(true)

    let contributorToDelete: StudyContributorDeleteParams

    if (contributor.type === 'parent') {
      // Delete all contributors related to this account
      contributorToDelete = {
        accountId: contributor.accountId,
        post: 'allPost',
        subPosts: ['allSubPost'],
      }
    } else {
      // Delete specific post assignment
      contributorToDelete = {
        accountId: contributor.accountId,
        post: contributor.post,
        subPosts: contributor.subPosts,
      }
    }

    await callServerFunction(() => deleteStudyContributor(contributorToDelete, study.id), {
      onSuccess: () => {
        setToDelete(undefined)
        router.refresh()
      },
    })
    setDeleting(false)
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
        <div className={styles.container}>
          <table aria-labelledby="study-rights-table-title" className="mb2">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className={styles.headerWidth}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => {
                const rowData = row.original
                const isParentRow = rowData.type === 'parent'

                return (
                  <tr
                    key={row.id}
                    data-testid="study-contributors-table-line"
                    className={isParentRow ? styles.parentRow : styles.childRow}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={isParentRow ? styles.parentCell : styles.childCell}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
          {contributorToDelete.type === 'parent'
            ? tDeleting('confirmation', { email: contributorToDelete.email })
            : tDeleting('confirmationPost', {
                email: contributorToDelete.email,
                post: tPost(contributorToDelete.post),
              })}
        </Modal>
      )}
    </>
  )
}

export default StudyContributorsTable
