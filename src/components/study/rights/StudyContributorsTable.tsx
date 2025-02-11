'use client'

import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import HelpIcon from '@/components/base/HelpIcon'
import { FullStudy } from '@/db/study'
import { isAdminOnStudyOrga } from '@/services/permissions/study'
import { Post, subPostsByPost } from '@/services/posts'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { StudyRole } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import styles from './StudyRights.module.css'

interface Props {
  study: FullStudy
  user: User
  userRoleOnStudy?: StudyRole
}

const allPosts = Object.values(Post)
const StudyContributorsTable = ({ study, user, userRoleOnStudy }: Props) => {
  const t = useTranslations('study.rights.contributorsTable')
  const tRole = useTranslations('study.rights.contributorsTable.role')
  const tPost = useTranslations('emissionFactors.post')
  const [displayRoles, setDisplayRoles] = useState(false)

  // Complexe method to simplify the display on the table...
  const data = useMemo(
    () =>
      study.contributors
        .filter(
          (contributor, index) =>
            study.contributors.findIndex((value) => value.user.email === contributor.user.email) === index,
        )
        .map((contributor) => contributor.user.email)
        .map((email) => ({
          email,
          subPosts: study.contributors
            .filter((contributor) => contributor.user.email === email)
            .map((contributor) => contributor.subPost),
        }))
        .map(({ email, subPosts }) => ({
          email,
          posts: allPosts
            .map((post) => ({
              post,
              subPosts: subPostsByPost[post].filter((subPost) => subPosts.includes(subPost)),
            }))
            .filter(({ subPosts }) => subPosts.length > 0),
        }))
        .flatMap(({ email, posts }) =>
          posts.length === allPosts.length
            ? [{ email, post: 'allPost', subPosts: ['allSubPost'] }]
            : posts.map(({ post, subPosts }) => ({
                email,
                post,
                subPosts: subPosts.length === subPostsByPost[post].length ? ['allSubPost'] : subPosts,
              })),
        ),
    [study],
  )

  const columns = useMemo(() => {
    const columns: ColumnDef<{ email: string; post: string; subPosts: string[] }>[] = [
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
    return columns
  }, [t, tPost])

  const table = useReactTable({
    columns,
    getRowId: (row) => row.email + row.post,
    data,
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
            label={tRole('information')}
          />
        }
        expIcon
        actions={
          isAdminOnStudyOrga(user, study) || userRoleOnStudy !== StudyRole.Reader
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
      <Dialog
        open={displayRoles}
        aria-labelledby="study-contributor-role-title"
        aria-describedby="study-contributor-role-description"
      >
        <DialogTitle id="study-contributor-role-title">{tRole('information')}</DialogTitle>
        <DialogContent>
          <p className="mb-2">{tRole('description')}</p>
        </DialogContent>
        <DialogActions>
          <Button data-testid="study-contributor-role-close" onClick={() => setDisplayRoles(false)}>
            {tRole('close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default StudyContributorsTable
