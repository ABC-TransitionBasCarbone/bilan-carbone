'use client'

import { FullStudy } from '@/db/study'
import { sumEmissionSourcesResults } from '@/services/emissionSource'
import { Post, subPostsByPost } from '@/services/posts'
import { getStandardDeviationRating } from '@/services/uncertainty'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { ColumnDef, flexRender, getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './ResultsTable.module.css'

interface Props {
  study: FullStudy
}

type Data = {
  post: string
  value: number
  uncertainty?: number
  subPosts?: Data[]
}

const ResultsTable = ({ study }: Props) => {
  const t = useTranslations('study.results')
  const tQuality = useTranslations('quality')
  const tPost = useTranslations('emissionFactors.post')

  const columns = useMemo(
    () =>
      [
        {
          header: t('post'),
          accessorFn: ({ post }) => tPost(post),
          cell: ({ row, getValue }) => {
            return row.getCanExpand() ? (
              <button
                onClick={row.getToggleExpandedHandler()}
                className={classNames('align-center', styles.expandable)}
              >
                {row.getIsExpanded() ? (
                  <KeyboardArrowDownIcon className={styles.svg} />
                ) : (
                  <KeyboardArrowRightIcon className={styles.svg} />
                )}
                {getValue<string>()}
              </button>
            ) : (
              <p className={classNames('align-center', styles.notExpandable, { [styles.subPost]: row.depth > 0 })}>
                {getValue<string>()}
              </p>
            )
          },
        },
        {
          header: t('uncertainty'),
          accessorFn: ({ uncertainty }) =>
            uncertainty ? tQuality(getStandardDeviationRating(uncertainty).toString()) : '',
        },
        {
          header: t('value'),
          accessorKey: 'value',
          cell: ({ getValue }) => <p className={styles.number}>{getValue<number>().toFixed(2)}</p>,
        },
      ] as ColumnDef<Data>[],
    [t],
  )

  const data = useMemo(() => {
    return Object.values(Post)
      .sort((a, b) => tPost(a).localeCompare(tPost(b)))
      .map((post) => {
        const subPosts = subPostsByPost[post]
          .map((subPost) => {
            const emissionSources = study.emissionSources.filter((emissionSource) => emissionSource.subPost === subPost)
            return {
              post: subPost,
              value: emissionSources.reduce(
                (acc, emission) =>
                  acc +
                  (!emission.value || !emission.emissionFactor ? 0 : emission.value * emission.emissionFactor.totalCo2),
                0,
              ),
              uncertainty: sumEmissionSourcesResults(emissionSources),
            }
          })
          .filter((subPost) => subPost.value > 0)

        const value = subPosts.flatMap((subPost) => subPost).reduce((acc, subPost) => acc + subPost.value, 0)
        return {
          post,
          value,
          uncertainty:
            subPosts.length > 0
              ? Math.exp(
                  Math.sqrt(
                    subPosts.reduce(
                      (acc, subPost) =>
                        acc + Math.pow(subPost.value / value, 2) * Math.pow(Math.log(subPost.uncertainty || 1), 2),
                      0,
                    ),
                  ),
                )
              : undefined,
          subPosts: subPosts.sort((a, b) => tPost(a.post).localeCompare(tPost(b.post))),
        } as Data
      })
  }, [tPost, study])

  const table = useReactTable({
    columns,
    data,
    getSubRows: (row) => row.subPosts,
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
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
            <tr key={row.id}>
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

export default ResultsTable
