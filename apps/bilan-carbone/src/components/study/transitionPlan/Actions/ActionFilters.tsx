'use client'

import DebouncedInput from '@/components/base/DebouncedInput'
import MultiSelectAll from '@/components/base/MultiSelectAll'
import { Button } from '@abc-transitionbascarbone/ui'
import { FormControl, InputLabel } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './Actions.module.css'

export const NO_OWNER = 'NO_OWNER'

interface Props {
  search: string
  setSearch: (search: string) => void
  openAddModal: () => void
  canEdit: boolean
  owners: string[]
  ownerFilter: string[]
  setOwnerFilter: (owners: string[]) => void
}

const ActionFilters = ({ search, setSearch, openAddModal, canEdit, owners, ownerFilter, setOwnerFilter }: Props) => {
  const t = useTranslations('study.transitionPlan.actions')
  const tTable = useTranslations('study.transitionPlan.actions.table')

  const allValues = [...owners, NO_OWNER]

  return (
    <div className="grow justify-between align-center">
      <div className="flex align-center gapped1">
        <DebouncedInput
          className={styles.searchInput}
          debounce={200}
          value={search}
          onChange={setSearch}
          placeholder={t('search')}
          data-testid="actions-filter"
        />
        {owners.length > 0 && (
          <FormControl className={styles.ownerFilter}>
            <InputLabel id="owner-filter-label" shrink>
              {tTable('owner')}
            </InputLabel>
            <MultiSelectAll
              id="owner-filter"
              values={ownerFilter}
              allValues={allValues}
              setValues={setOwnerFilter}
              getLabel={(v) => (v === NO_OWNER ? tTable('noOwner') : v)}
              label={tTable('owner')}
            />
          </FormControl>
        )}
      </div>
      {canEdit && (
        <Button className={styles.addButton} onClick={openAddModal}>
          {t('add')}
        </Button>
      )}
    </div>
  )
}

export default ActionFilters
