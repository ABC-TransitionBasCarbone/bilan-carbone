import { Table as MuiTable, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { flexRender, Table as ReactTable, Row } from '@tanstack/react-table'
import classNames from 'classnames'
import { ReactNode } from 'react'
import styles from './Table.module.css'
import Pagination from './TablePagination'

interface Props<TData> {
  title?: string
  table: ReactTable<TData>
  paginations?: number[]
  className?: string
  children?: ReactNode
  customRow?: (row: Row<TData>) => React.ReactNode
  testId: string
  size?: 'small' | 'medium'
}

const Table = <TData,>({
  title,
  table,
  paginations,
  className,
  children,
  customRow,
  testId,
  size = 'medium',
}: Props<TData>) => {
  const totalRows = table.getRowCount()
  const shouldShowPagination = !!paginations && totalRows > Math.min(...paginations)

  return (
    <>
      {title && <>{title}</>}
      {children}
      <div className={className}>
        <MuiTable
          aria-labelledby={`${testId}-table-title`}
          className={classNames(styles.tableWrapper, { [styles.small]: size === 'small' })}
        >
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell key={header.id} className={header.id === 'actions' ? styles.actionsColumn : undefined}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.flatMap((row) =>
              customRow ? (
                customRow(row)
              ) : (
                <TableRow key={row.id} className={styles.line} data-testid={`${testId}-table-row`}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      data-testid={`${testId}-${cell.column.id}`}
                      className={cell.column.id === 'actions' ? styles.actionsColumn : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ),
            )}
          </TableBody>
        </MuiTable>
      </div>
      {shouldShowPagination && <Pagination table={table} paginations={paginations} />}
    </>
  )
}

export default Table
