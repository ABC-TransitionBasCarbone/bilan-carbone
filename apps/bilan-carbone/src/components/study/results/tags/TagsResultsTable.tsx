import BaseTable from '@/components/base/Table'
import { ResultsByTag } from '@/services/results/consolidated'
import { getQualitativeUncertaintyFromSquaredStandardDeviation } from '@/services/uncertainty'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { StudyResultUnit } from '@repo/db-common'
import { ColumnDef, getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import commonStyles from '../commonTable.module.css'

type tableDataType = {
  label: string
  value: number
  squaredStandardDeviation: number
  children: tableDataType[]
}
interface Props {
  resultsUnit: StudyResultUnit
  data: ResultsByTag[]
}
const TagsResultsTable = ({ resultsUnit, data }: Props) => {
  const t = useTranslations('study.results')
  const tQuality = useTranslations('quality')
  const tUnits = useTranslations('study.results.units')

  const columns = useMemo(() => {
    return [
      {
        header: t('tag'),
        accessorFn: ({ label }) => label,
        cell: ({ getValue, row }) => {
          return row.getCanExpand() ? (
            <button
              onClick={row.getToggleExpandedHandler()}
              className={classNames('align-center', commonStyles.expandable)}
            >
              {row.getIsExpanded() ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
              {getValue<string>()}
            </button>
          ) : (
            <p className={classNames('align-center', commonStyles.notExpandable, { pl1: row.depth > 0 })}>
              {getValue<string>()}
            </p>
          )
        },
      },
      {
        header: t('uncertainty'),
        accessorFn: ({ squaredStandardDeviation }) =>
          squaredStandardDeviation
            ? tQuality(getQualitativeUncertaintyFromSquaredStandardDeviation(squaredStandardDeviation).toString())
            : '',
      },
      {
        header: t('emissions'),
        accessorKey: 'value',
        cell: ({ getValue }) => <p>{formatNumber(getValue<number>() / STUDY_UNIT_VALUES[resultsUnit])}</p>,
      },
    ]
  }, [resultsUnit, t, tQuality]) as ColumnDef<tableDataType>[]

  const tableData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        children: d.children.map((child) => ({ ...child, children: [] })),
      })),
    [data],
  )

  const table = useReactTable({
    columns,
    data: tableData,
    getSubRows: (row) => row.children,
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <BaseTable
      table={table}
      testId="tags-results"
      size="small"
      firstHeader={<div className="text-center">{t('gesTag', { unit: tUnits(resultsUnit) })}</div>}
    />
  )
}

export default TagsResultsTable
