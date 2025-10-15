'use client'

import Button from '@/components/base/Button'
import DebouncedInput from '@/components/base/DebouncedInput'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import ActionModal from './ActionModal'
import styles from './Actions.module.css'

interface Props {
  search: string
  setSearch: (search: string) => void
  studyId: string
  studyUnit: string
  porters: { label: string; value: string }[]
}

const ActionFilters = ({ search, setSearch, studyId, studyUnit, porters }: Props) => {
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
      <Button onClick={() => setAddAction((prev) => !prev)}>{t('add')}</Button>
      {addAction && (
        <ActionModal
          open
          onClose={() => setAddAction(false)}
          studyId={studyId}
          studyUnit={studyUnit}
          porters={porters}
        />
      )}
    </div>
  )
}

export default ActionFilters
