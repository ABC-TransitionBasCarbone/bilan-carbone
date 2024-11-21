'use client'

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'
import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'

interface Props {
  study: FullStudy
}

const allPosts = Object.values(Post)
const StudyContributorsTable = ({ study }: Props) => {
  const t = useTranslations('study.rights.contributorsTable')
  const tPost = useTranslations('emissionFactors.post')

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
          <tr key={row.id} data-testid="study-contributors-table-line">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default StudyContributorsTable
