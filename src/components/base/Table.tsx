import { Translations } from '@/types/translation'
import { flexRender, Table as ReactTable, Row } from '@tanstack/react-table'
import { ReactNode } from 'react'
import styles from './Table.module.css'
import Pagination from './TablePagination'

interface Props<TData> {
  title?: string
  table: ReactTable<TData>
  t: Translations
  paginations?: number[]
  className?: string
  children?: ReactNode
  customRow?: (row: Row<TData>) => React.ReactNode
  testId: string
}

const Table = <TData,>({ title, table, t, paginations, className, children, customRow, testId }: Props<TData>) => (
  <>
    {title && <>{t(title)}</>}
    {children}
    <div className={className}>
      <table aria-labelledby={`${testId}-table-title`}>
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
          {table.getRowModel().rows.flatMap((row) =>
            customRow ? (
              customRow(row)
            ) : (
              <tr key={row.id} className={styles.line} data-testid={`${testId}-table-row`}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} data-testid={`${testId}-${cell.column.id}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
    {!!paginations && <Pagination table={table} paginations={paginations} />}
  </>
)

export default Table
