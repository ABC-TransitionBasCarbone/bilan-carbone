'use client'

import DebouncedInput from '@/components/base/DebouncedInput'
import { useTranslations } from 'next-intl'
import styles from './ObjectivesTable.module.css'

interface Props {
  search: string
  setSearch: (search: string) => void
}

const ObjectiveFilters = ({ search, setSearch }: Props) => {
  const t = useTranslations('study.transitionPlan.objectives')

  return (
    <div className="grow justify-between align-center">
      <DebouncedInput
        className={styles.searchInput}
        debounce={200}
        value={search}
        onChange={setSearch}
        placeholder={t('search')}
        data-testid="objectives-filter"
      />
    </div>
  )
}

export default ObjectiveFilters
