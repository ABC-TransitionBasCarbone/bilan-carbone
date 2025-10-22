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
  studyUnit: string
  porters: { label: string; value: string }[]
  transitionPlanId: string
}

const ActionFilters = ({ search, setSearch, studyUnit, porters, transitionPlanId }: Props) => {
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
          transitionPlanId={transitionPlanId}
          studyUnit={studyUnit}
          porters={porters}
        />
      )}
    </div>
  )
}

export default ActionFilters
