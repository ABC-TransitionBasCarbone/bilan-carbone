'use client'

import Button from '@/components/base/Button'
import DebouncedInput from '@/components/base/DebouncedInput'
import { useTranslations } from 'next-intl'
import styles from './Actions.module.css'

interface Props {
  search: string
  setSearch: (search: string) => void
  onOpenAddModal: () => void
}

const ActionFilters = ({ search, setSearch, onOpenAddModal }: Props) => {
  const t = useTranslations('study.transitionPlan.actions')

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
      <Button className={styles.addButton} onClick={onOpenAddModal}>
        {t('add')}
      </Button>
    </div>
  )
}

export default ActionFilters
