import { Table as MuiTable, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { flexRender, Table as ReactTable, Row } from '@tanstack/react-table'
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
}

const Table = <TData,>({ title, table, paginations, className, children, customRow, testId }: Props<TData>) => (
  <>
    {title && <>{title}</>}
    {children}
    <div className={className}>
      <MuiTable aria-labelledby={`${testId}-table-title`} className={styles.tableWrapper}>
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableCell key={header.id}>
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
                  <TableCell key={cell.id} data-testid={`${testId}-${cell.column.id}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ),
          )}
        </TableBody>
      </MuiTable>
    </div>
    {!!paginations && <Pagination table={table} paginations={paginations} />}
  </>
)

export default Table
