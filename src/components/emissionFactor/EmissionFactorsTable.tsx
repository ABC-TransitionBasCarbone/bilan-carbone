'use client'

import { EmissionFactorList } from '@/db/emissionFactors'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { BCUnit, useUnitLabel } from '@/services/unit'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import { formatEmissionFactorNumber } from '@/utils/number'
import {
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Button as MuiButton,
  OutlinedInput,
  Select,
} from '@mui/material'
import { Environment, StudyResultUnit } from '@prisma/client'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  OnChangeFn,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo } from 'react'
import EmissionFactorDetails from './EmissionFactorDetails'
import styles from './EmissionFactorsTable.module.css'
import { EmissionFactorActionCell } from './tableCells/EmissionFactorActionCell'
import { EmissionFactorNameCell } from './tableCells/EmissionFactorNameCell'
import { EmissionFactorSourceCell } from './tableCells/EmissionFactorSourceCell'
import { EmissionFactorStatusCell } from './tableCells/EmissionFactorStatusCell'

interface Props {
  data: EmissionFactorList[]
  userOrganizationId?: string | null
  environment: Environment
  pagination: PaginationState
  totalCount: number
  setPagination: OnChangeFn<PaginationState>
  setTargetedEmission: (emissionFactorId: string) => void
  setAction: (action: 'edit' | 'delete' | undefined) => void
  selectEmissionFactor?: (emissionFactor: EmissionFactorWithMetaData) => void
  hasActiveLicence: boolean
}
export const EmissionFactorsTable = ({
  data,
  userOrganizationId,
  environment,
  pagination,
  totalCount,
  setPagination,
  setTargetedEmission,
  setAction,
  selectEmissionFactor,
  hasActiveLicence,
}: Props) => {
  const t = useTranslations('emissionFactors.table')
  const tResultUnits = useTranslations('study.results.units')
  const getUnitLabel = useUnitLabel()

  const fromModal = useMemo(() => Boolean(selectEmissionFactor), [selectEmissionFactor])

  const getLocationLabel = useMemo(
    () => (row: EmissionFactorWithMetaData) =>
      `${row.location || t('noLocation')}${row.metaData?.location ? ` - ${row.metaData.location}` : ''}`,
    [t],
  )

  const columns = useMemo(() => {
    const columnsToReturn = [
      {
        id: 'name',
        header: t('name'),
        accessorFn: (emissionFactor) =>
          emissionFactor.metaData
            ? `${emissionFactor.metaData.title}${emissionFactor.metaData.attribute ? ` - ${emissionFactor.metaData.attribute}` : ''}${emissionFactor.metaData.frontiere ? ` - ${emissionFactor.metaData.frontiere}` : ''}`
            : '',
        cell: ({ getValue, row }) => <EmissionFactorNameCell expanded={row.getIsExpanded()} getValue={getValue} />,
      },
      {
        header: t('value'),
        accessorFn: (emissionFactor) =>
          `${formatEmissionFactorNumber(getEmissionFactorValue(emissionFactor, environment))} ${tResultUnits(StudyResultUnit.K)}/${emissionFactor.unit === BCUnit.CUSTOM ? emissionFactor.customUnit : getUnitLabel(emissionFactor.unit || '')}`,
      },
      {
        header: t('location'),
        accessorFn: (emissionFactor) => getLocationLabel(emissionFactor),
        cell: ({ getValue }) => <span>{getValue<string>() || ' '}</span>,
      },
      {
        header: t('status'),
        accessorKey: 'status',
        cell: ({ getValue }) => <EmissionFactorStatusCell getValue={getValue} />,
      },
      {
        header: t('source'),
        accessorKey: 'importedFrom',
        cell: ({ getValue, row }) => (
          <EmissionFactorSourceCell
            fromModal={fromModal}
            isFromRightOrga={userOrganizationId === row.original.organizationId}
            efId={row.original.id}
            getValue={getValue}
            setTargetedEmission={setTargetedEmission}
            setAction={setAction}
            hasActiveLicence={hasActiveLicence}
          />
        ),
      },
    ] as ColumnDef<EmissionFactorWithMetaData>[]

    if (selectEmissionFactor) {
      columnsToReturn.push({
        id: 'actions',
        header: '',
        accessorKey: 'id',
        cell: ({ row }) => (
          <EmissionFactorActionCell emissionFactor={row.original} selectEmissionFactor={selectEmissionFactor} />
        ),
      })
    }

    return columnsToReturn
  }, [
    t,
    selectEmissionFactor,
    environment,
    tResultUnits,
    getUnitLabel,
    getLocationLabel,
    fromModal,
    userOrganizationId,
    setTargetedEmission,
    setAction,
    hasActiveLicence,
  ])

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getRowCanExpand: () => true,
    getExpandedRowModel: getExpandedRowModel(),
    state: { pagination },
    autoResetAll: false,
  })

  useEffect(() => {
    table.toggleAllRowsExpanded(false)
  }, [table, data])

  return (
    <>
      <div className={classNames('grow', { [styles.modalTable]: fromModal })}>
        <table className={styles.table}>
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
            {table.getRowModel().rows.flatMap((row) => {
              const lines = [
                <tr key={row.id} className={classNames(styles.line, { [styles.open]: row.getIsExpanded() })}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} data-testid={`cell-emission-${cell.column.id}`}>
                      {cell.column.id === 'actions' ? (
                        <div className={styles.cellDiv}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      ) : (
                        <div className={styles.cellButton} onClick={() => row.toggleExpanded()}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>,
              ]
              if (row.getIsExpanded()) {
                lines.push(
                  <tr key={`${row.id}-details`}>
                    <td colSpan={columns.length} className={classNames(styles.detail, 'p1')}>
                      <EmissionFactorDetails emissionFactor={row.original} />
                    </td>
                  </tr>,
                )
              }
              return lines
            })}
          </tbody>
        </table>
      </div>
      <div className={classNames(styles.pagination, 'align-center mt1')}>
        <MuiButton onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          {'<'}
        </MuiButton>
        <MuiButton onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {'>'}
        </MuiButton>
        <p>
          {t('page', {
            page: pagination.pageIndex + 1,
            total: Math.ceil(totalCount / pagination.pageSize).toLocaleString(),
          })}
        </p>
        <FormControl className={styles.selector}>
          <InputLabel id="emissions-paginator-count-selector">{t('items')}</InputLabel>
          <Select
            id="emissions-paginator-count-selector"
            labelId="emissions-paginator-count-selector"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            input={<OutlinedInput label={t('items')} />}
          >
            {[25, 50, 100, 200, 500].map((count) => (
              <MenuItem key={count} value={count}>
                <ListItemText primary={count} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      <div>
        {t('showing', {
          number: table.getRowModel().rows.length.toLocaleString(),
          total: totalCount,
        })}
      </div>
    </>
  )
}
