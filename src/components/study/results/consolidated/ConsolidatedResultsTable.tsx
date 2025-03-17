'use client'

import { FullStudy } from '@/db/study'
import { computeResultsByPost, ResultsByPost } from '@/services/results/consolidated'
import { getUserSettings } from '@/services/serverFunctions/user'
import { getStandardDeviationRating } from '@/services/uncertainty'
import { defaultStudyResultUnit, formatNumber, STUDY_UNIT_VALUES } from '@/utils/number'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { StudyResultUnit } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import styles from './ConsolidatedResultsTable.module.css'

interface Props {
  study: FullStudy
  studySite: string
  withDependencies: boolean
}

const ConsolidatedResultsTable = ({ study, studySite, withDependencies }: Props) => {
  const t = useTranslations('study.results')
  const tQuality = useTranslations('quality')
  const tPost = useTranslations('emissionFactors.post')

  const tUnits = useTranslations('settings.studyResultUnit')
  const [validatedOnly, setValidatedOnly] = useState(true)
  const [resultsUnit, setResultsUnit] = useState<StudyResultUnit>(defaultStudyResultUnit)

  useEffect(() => {
    applyUserSettings()
  }, [])

  const applyUserSettings = async () => {
    const userSettings = await getUserSettings()
    if (userSettings?.validatedEmissionSourcesOnly !== undefined) {
      setValidatedOnly(userSettings.validatedEmissionSourcesOnly)
    }
    if (userSettings?.studyUnit) {
      setResultsUnit(userSettings.studyUnit)
    }
  }

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
          header: t('value', { unit: tUnits(resultsUnit) }),
          accessorKey: 'value',
          cell: ({ getValue }) => (
            <p className={styles.number}>{formatNumber(getValue<number>() / STUDY_UNIT_VALUES[resultsUnit], 0)}</p>
          ),
        },
      ] as ColumnDef<ResultsByPost>[],
    [t, tPost, tQuality],
  )

  const data = useMemo(
    () => computeResultsByPost(study, tPost, studySite, withDependencies, validatedOnly),
    [study, tPost, studySite, withDependencies, validatedOnly],
  )

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
            <tr key={row.id} data-testid="consolidated-results-table-row">
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

export default ConsolidatedResultsTable
