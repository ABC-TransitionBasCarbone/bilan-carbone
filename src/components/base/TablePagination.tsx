import { FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, TextField } from '@mui/material'
import { Table } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { ChangeEvent } from 'react'
import Button from './Button'
import styles from './Table.module.css'

interface Props<TData> {
  table: Table<TData>
  paginations: number[]
}

const Pagination = <TData,>({ table, paginations }: Props<TData>) => {
  const t = useTranslations('table')

  const onPaginationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const page = e.target.value ? Number(e.target.value) - 1 : 0
    if (page >= table.getPageCount()) {
      table.setPageIndex(table.getPageCount() - 1)
    } else {
      table.setPageIndex(page)
    }
  }

  return (
    <div className={classNames(styles.pagination, 'align-center mt1')}>
      <Button onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}>
        {'<<'}
      </Button>
      <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
        {'<'}
      </Button>
      <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
        {'>'}
      </Button>
      <Button onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>
        {'>>'}
      </Button>
      <p>
        {t('page', {
          page: table.getState().pagination.pageIndex + 1,
          total: (table.getPageCount() || 1).toLocaleString(),
        })}
      </p>
      {t('goTo')}
      <TextField
        type="number"
        classes={{ root: styles.pageInput }}
        slotProps={{
          htmlInput: { min: 1, max: table.getPageCount() },
          input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
        }}
        defaultValue={table.getState().pagination.pageIndex + 1}
        onChange={onPaginationChange}
      />
      <FormControl className={styles.selector}>
        <InputLabel id="emissions-paginator-count-selector">{t('items')}</InputLabel>
        <Select
          id="emissions-paginator-count-selector"
          labelId="emissions-paginator-count-selector"
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          input={<OutlinedInput label={t('items')} />}
        >
          {paginations.map((count) => (
            <MenuItem key={count} value={count}>
              <ListItemText primary={count} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  )
}

export default Pagination
