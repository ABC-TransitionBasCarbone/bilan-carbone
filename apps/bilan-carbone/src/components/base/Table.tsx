import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
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
  firstHeader?: ReactNode
  sortable?: boolean
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
  firstHeader,
  sortable = false,
}: Props<TData>) => {
  const totalRows = table.getRowCount()
  const shouldShowPagination = !!paginations && totalRows > Math.min(...paginations)

  return (
    <>
      {title && <>{title}</>}
      {children}
      <div className={classNames(styles.tableContainer, className)}>
        <MuiTable
          aria-labelledby={`${testId}-table-title`}
          className={classNames(styles.tableWrapper, { [styles.small]: size === 'small' })}
        >
          <TableHead>
            {firstHeader ? (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length}>{firstHeader}</TableCell>
              </TableRow>
            ) : null}
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className={styles.headers}>
                {headerGroup.headers.map((header) => {
                  const canSort = sortable && header.column.getCanSort()
                  const sortDirection = header.column.getIsSorted()
                  return (
                    <TableCell
                      key={header.id}
                      className={classNames(
                        header.id === 'actions' ? styles.actionsColumn : undefined,
                        sortable ? (canSort ? styles.sortable : styles.notSortable) : undefined,
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <span className="flex-cc gap025">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDirection && (
                            <span className="flex-cc">
                              {sortDirection === 'asc' ? (
                                <ExpandLessIcon fontSize="small" />
                              ) : (
                                <ExpandMoreIcon fontSize="small" />
                              )}
                            </span>
                          )}
                        </span>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableCell>
                  )
                })}
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
