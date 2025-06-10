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

interface Props {
  study: FullStudy
  canAddContributor: boolean
}

export interface StudyContributorRow {
  email: string
  accountId: string
  posts: {
    post: string
    subPosts: string[]
  }[]
  hasAllPosts?: boolean // Flag to indicate if user has access to all posts
  isContributorRow?: boolean // Main contributor row
}

export interface StudyContributorPostRow {
  email: string
  accountId: string
  post: string
  subPosts: string[]
  isPostRow?: boolean // Individual post assignment row
}

const faq = process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''

// Type guards
const isContributorRow = (row: StudyContributorRow | StudyContributorPostRow): row is StudyContributorRow => {
  return 'isContributorRow' in row && row.isContributorRow === true
}

const isPostRow = (row: StudyContributorRow | StudyContributorPostRow): row is StudyContributorPostRow => {
  return 'isPostRow' in row && row.isPostRow === true
}

// Constants
const PREVIEW_MAX_LINES = 2
const SUBPOST_PREVIEW_LIMIT = 3
const TABLE_COLUMN_WIDTHS = {
  email: '250px',
  post: '300px',
  subPosts: '350px',
  actions: '120px',
} as const

const StudyContributorsTable = ({ study, canAddContributor }: Props) => {
  const t = useTranslations('study.rights.contributorsTable')
  const tDeleting = useTranslations('study.rights.contributorsTable.deleting')
  const tRole = useTranslations('study.rights.contributorsTable.role')
  const tPost = useTranslations('emissionFactors.post')
  const [displayRoles, setDisplayRoles] = useState(false)
  const [contributorToDelete, setToDelete] = useState<StudyContributorRow | StudyContributorPostRow | undefined>(
    undefined,
  )
  const [deleting, setDeleting] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const { callServerFunction } = useServerFunction()

  const router = useRouter()

  const allPosts = useMemo(() => Object.values(BCPost), [])
  const allSubPosts = useMemo(() => allPosts.flatMap((post) => subPostsByPost[post]), [allPosts])

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

  const generatePostPreview = useCallback(
    (posts: StudyContributorRow['posts'], maxLines = 2, isExpanded = false, hasAllPosts = false) => {
      if (hasAllPosts && !isExpanded) {
        return {
          text: tPost('allPost'),
          hasMore: false,
          totalCount: posts.length,
        }
      }

      // Create preview lines with just post names (no sub-posts)
      const lines: string[] = []
      let processedPosts = 0

      for (const postData of posts) {
        const postLabel = tPost(postData.post)
        lines.push(postLabel)

        processedPosts++
        if (lines.length >= maxLines && !isExpanded) {
          break
        }
      }

      const hasMore = processedPosts < posts.length && !isExpanded
      const remainingPosts = posts.length - processedPosts

      return {
        text: lines.join(', '),
        hasMore,
        remainingPosts,
        totalCount: posts.length,
      }
    },
    [tPost],
  )

  const generateSubPostPreview = useCallback(
    (posts: StudyContributorRow['posts'], hasAllPosts = false) => {
      if (hasAllPosts) {
        return {
          text: tPost('allSubPost'),
          totalSubPosts: allSubPosts.length,
        }
      }

      // Calculate actual sub-posts the contributor has access to
      let actualSubPosts: string[] = []

      posts.forEach((postData) => {
        if (postData.subPosts.length === 1 && postData.subPosts[0] === 'allSubPost') {
          // If this post has "all sub-posts", add all sub-posts for this post
          actualSubPosts = actualSubPosts.concat(subPostsByPost[postData.post as Post])
        } else {
          // Add the specific sub-posts
          actualSubPosts = actualSubPosts.concat(postData.subPosts)
        }
      })

      // Get all possible sub-posts from all posts the contributor has access to
      const allPossibleSubPosts = posts.flatMap((postData) => subPostsByPost[postData.post as Post])

      const uniqueActualSubPosts = [...new Set(actualSubPosts)]
      const uniquePossibleSubPosts = [...new Set(allPossibleSubPosts)]

      // Check if contributor has access to ALL possible sub-posts
      const hasAllSubPosts = uniquePossibleSubPosts.every((sp) => uniqueActualSubPosts.includes(sp))

      if (hasAllSubPosts) {
        return {
          text: tPost('allSubPost'),
          totalSubPosts: uniqueActualSubPosts.length,
        }
      }

      // Show preview of sub-posts
      const previewSubPosts = uniqueActualSubPosts
        .slice(0, SUBPOST_PREVIEW_LIMIT)
        .map((sp) => tPost(sp))
        .join(', ')
      const hasMore = uniqueActualSubPosts.length > SUBPOST_PREVIEW_LIMIT
      const suffix = hasMore
        ? ` ${t('andXOthers', { count: uniqueActualSubPosts.length - SUBPOST_PREVIEW_LIMIT })}`
        : ''

      return {
        text: `${previewSubPosts}${suffix}`,
        totalSubPosts: uniqueActualSubPosts.length,
      }
    },
    [tPost, t, allSubPosts],
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
          ...contributor,
          posts,
          hasAllPosts, // Add this flag to track if user has all posts
          isContributorRow: true,
        }
      })

    // Flatten the data: contributor rows + their expanded post rows
    const flattenedData: (StudyContributorRow | StudyContributorPostRow)[] = []

    contributorData.forEach((contributor) => {
      // Add main contributor row
      flattenedData.push(contributor)

      // If expanded, add post sub-rows
      if (expandedRows.has(contributor.email)) {
        contributor.posts.forEach((postData) => {
          flattenedData.push({
            email: contributor.email,
            accountId: contributor.accountId,
            post: postData.post,
            subPosts: postData.subPosts,
            isPostRow: true,
          })
        })
      }
    })

    return flattenedData
  }, [study.contributors, allPosts, expandedRows])

  const columns = useMemo(() => {
    const columns: ColumnDef<StudyContributorRow | StudyContributorPostRow>[] = [
      {
        header: t('email'),
        cell: ({ row }) => {
          const rowData = row.original

          if (isContributorRow(rowData)) {
            // Main contributor row with expand/collapse
            const isExpanded = expandedRows.has(rowData.email)

            return (
              <div
                className="flex align-center"
                style={{
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
                onClick={() => toggleRowExpansion(rowData.email)}
              >
                <IconButton
                  size="small"
                  style={{ padding: '4px', marginRight: '8px' }}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
                <span>{rowData.email}</span>
              </div>
            )
          } else {
            // Post sub-row - indented, no email display
            return <div style={{ paddingLeft: '40px', color: '#666' }}>{/* Empty for sub-rows */}</div>
          }
        },
      },
      {
        header: t('post'),
        cell: ({ row }) => {
          const rowData = row.original

          if (isContributorRow(rowData)) {
            // For contributor rows, show preview with truncation
            const isExpanded = expandedRows.has(rowData.email)
            const preview = generatePostPreview(rowData.posts, PREVIEW_MAX_LINES, isExpanded, rowData.hasAllPosts)

            return (
              <div
                style={{
                  maxWidth: TABLE_COLUMN_WIDTHS.post,
                  cursor: 'pointer',
                }}
                onClick={() => toggleRowExpansion(rowData.email)}
              >
                <div>
                  {isExpanded && rowData.hasAllPosts
                    ? tPost('allPost')
                    : isExpanded
                      ? `${preview.totalCount} post(s)`
                      : preview.text}
                  {!isExpanded && preview.hasMore && ` ${t('andXOthers', { count: preview.remainingPosts || 0 })}`}
                </div>
              </div>
            )
          } else {
            // For post sub-rows, show the specific post
            const postRow = rowData as StudyContributorPostRow
            return <span>{tPost(postRow.post)}</span>
          }
        },
      },
      {
        header: t('subPosts'),
        cell: ({ row }) => {
          const rowData = row.original

          if (isContributorRow(rowData)) {
            // For contributor rows, show sub-posts preview and count
            const isExpanded = expandedRows.has(rowData.email)
            const subPostPreview = generateSubPostPreview(rowData.posts, rowData.hasAllPosts)

            return (
              <div
                style={{
                  maxWidth: TABLE_COLUMN_WIDTHS.subPosts,
                  cursor: 'pointer',
                }}
                onClick={() => toggleRowExpansion(rowData.email)}
              >
                <div>
                  {isExpanded && rowData.hasAllPosts
                    ? tPost('allSubPost')
                    : isExpanded
                      ? `${subPostPreview.totalSubPosts} sous-poste${subPostPreview.totalSubPosts > 1 ? 's' : ''}`
                      : subPostPreview.text}
                </div>
              </div>
            )
          } else {
            // For post sub-rows, show the specific sub-posts
            const subPostRow = rowData as StudyContributorPostRow
            if (subPostRow.subPosts.length === 1 && subPostRow.subPosts[0] === 'allSubPost') {
              // If this post has all sub-posts, show "Tous les sous postes"
              return <span>{tPost('allSubPost')}</span>
            } else {
              // Show the specific sub-posts
              return <span>{subPostRow.subPosts.map((subPost: string) => tPost(subPost)).join(', ')}</span>
            }
          }
        },
      },
    ]

    return canAddContributor
      ? columns.concat([
          {
            header: t('actions'),
            cell: ({ row }) => {
              const rowData = row.original

              if (isContributorRow(rowData)) {
                // Delete entire contributor
                return (
                  <div className="flex-cc">
                    <Button
                      aria-label={t('delete')}
                      title={t('delete')}
                      onClick={() => setToDelete(rowData)}
                      data-testid={`delete-study-contributor-button`}
                    >
                      <DeleteIcon color="error" />
                    </Button>
                  </div>
                )
              } else {
                // Delete specific post assignment
                const postRow = rowData as StudyContributorPostRow
                return (
                  <div className="flex-cc">
                    <Button
                      aria-label={t('delete')}
                      title={`Delete ${tPost(postRow.post)}`}
                      onClick={() => setToDelete(postRow)}
                      data-testid={`delete-study-contributor-post-button`}
                      size="small"
                    >
                      <DeleteIcon color="error" fontSize="small" />
                    </Button>
                  </div>
                )
              }
            },
          },
        ])
      : columns
  }, [canAddContributor, expandedRows, t, tPost, toggleRowExpansion, generatePostPreview, generateSubPostPreview])

  const table = useReactTable({
    columns,
    getRowId: (row) => {
      if (isContributorRow(row)) {
        return `contributor-${row.email}`
      } else {
        const postRow = row as StudyContributorPostRow
        return `post-${row.email}-${postRow.post}`
      }
    },
    data,
    getCoreRowModel: getCoreRowModel(),
  })

  const deleteContributor = async (contributor: StudyContributorRow | StudyContributorPostRow) => {
    setDeleting(true)

    let contributorToDelete: StudyContributorPostRow

    if (isContributorRow(contributor)) {
      // Delete entire contributor (all posts)
      contributorToDelete = {
        email: contributor.email,
        accountId: contributor.accountId,
        post: 'allPost', // This signals to delete all posts for this contributor
        subPosts: ['allSubPost'],
      }
    } else {
      // Delete specific post assignment
      const postRow = contributor as StudyContributorPostRow
      contributorToDelete = {
        email: contributor.email,
        accountId: contributor.accountId,
        post: postRow.post,
        subPosts: postRow.subPosts,
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
        <div style={{ overflowX: 'auto' }}>
          <table aria-labelledby="study-rights-table-title" className="mb2">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => (
                    <th
                      key={header.id}
                      style={{
                        textAlign: 'left',
                        padding: '12px 8px',
                        borderBottom: '1px solid #e0e0e0',
                        width:
                          index === 0
                            ? TABLE_COLUMN_WIDTHS.email
                            : index === 1
                              ? TABLE_COLUMN_WIDTHS.post
                              : index === 2
                                ? TABLE_COLUMN_WIDTHS.subPosts
                                : TABLE_COLUMN_WIDTHS.actions,
                      }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => {
                const rowData = row.original
                const isContributorRowType = isContributorRow(rowData)
                const isPostRowType = isPostRow(rowData)

                return (
                  <tr
                    key={row.id}
                    data-testid="study-contributors-table-line"
                    style={{
                      backgroundColor: isContributorRowType ? '#f8f9fa' : '#ffffff',
                      borderLeft: isPostRowType ? '3px solid #e3f2fd' : 'none',
                    }}
                  >
                    {row.getVisibleCells().map((cell, index) => (
                      <td
                        key={cell.id}
                        style={{
                          padding: isContributorRowType ? '20px 8px' : '8px 8px',
                          borderBottom: '1px solid #f0f0f0',
                          verticalAlign: 'top',
                          width:
                            index === 0
                              ? TABLE_COLUMN_WIDTHS.email
                              : index === 1
                                ? TABLE_COLUMN_WIDTHS.post
                                : index === 2
                                  ? TABLE_COLUMN_WIDTHS.subPosts
                                  : TABLE_COLUMN_WIDTHS.actions,

                          minHeight: isContributorRowType ? '60px' : 'auto',
                        }}
                      >
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
          {isContributorRow(contributorToDelete)
            ? tDeleting('confirmation', { email: contributorToDelete.email })
            : tDeleting('confirmationPost', {
                email: contributorToDelete.email,
                post: tPost((contributorToDelete as StudyContributorPostRow).post),
              })}
        </Modal>
      )}
    </>
  )
}

export default StudyContributorsTable
