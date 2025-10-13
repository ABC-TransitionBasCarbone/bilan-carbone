'use client'

import Button from '@/components/base/Button'
import DebouncedInput from '@/components/base/DebouncedInput'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import styles from './Actions.module.css'
import AddActionModal from './AddActionModal'

interface Props {
  search: string
  setSearch: (search: string) => void
}

const ActionFilters = ({ search, setSearch }: Props) => {
  const t = useTranslations('study.transitionPlan.actions')
  const [addAction, setAddAction] = useState(false)

  return (
    <div className="grow justify-between align-center">
      <DebouncedInput
        className={styles.searchInput}
        debounce={200}
        value={search}
        onChange={setSearch}
        placeholder={t('search')}
        data-testid="actions-filter"
      />
      <Button onClick={() => setAddAction(!addAction)}>{t('add')}</Button>
      <AddActionModal open={addAction} onClose={() => setAddAction(false)} />
    </div>
  )
}

export default ActionFilters
