import { PostInfos } from '@/services/results/exports'
import { Cell, flexRender, Row } from '@tanstack/react-table'
import commonStyles from './ExportResultsTable.module.css'

export const TableRow = (
  row: Row<PostInfos>,
  getCellClass: (row: Row<PostInfos>, cell: Cell<PostInfos, unknown>, isTotal: boolean) => string,
  rulesSpans: Record<string, number>,
  testId: string,
) => {
  const rule = row.original.rule.split('.')
  const category = rule[0]
  const isTotal = category === 'total'
  const isCategorieFirstRow = rule[1] === '1' || rule[1] === '09' || isTotal

  return (
    <tr
      key={row.id}
      data-testid={`${testId}-results-table-row`}
      data-category={category}
      className={isCategorieFirstRow ? commonStyles.categoryFirstRow : ''}
    >
      {row.getVisibleCells().map((cell) => {
        const shouldRenderCell = cell.column.id !== 'category' || isCategorieFirstRow

        if (!shouldRenderCell) {
          return null
        }

        const cellClass = getCellClass(row, cell, isTotal)

        return (
          <td
            key={cell.id}
            rowSpan={cell.column.id === 'category' ? rulesSpans[category] : undefined}
            className={cellClass}
            data-category={category}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        )
      })}
    </tr>
  )
}
