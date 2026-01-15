'use client'

import Button from '@/components/base/Button'
import DebouncedInput from '@/components/base/DebouncedInput'
import { SectenInfo } from '@prisma/client'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import styles from './TrajectoryObjectivesTable.module.css'

const TrajectoryCreationModal = dynamic(() => import('./TrajectoryCreationModal'), { ssr: false })

interface Props {
  search: string
  setSearch: (search: string) => void
  transitionPlanId: string
  onTrajectoryCreation: () => void
  canEdit: boolean
  studyYear: number
  sectenData: SectenInfo[]
}

const ObjectivesFilters = ({
  search,
  setSearch,
  transitionPlanId,
  onTrajectoryCreation,
  canEdit,
  studyYear,
  sectenData,
}: Props) => {
  const t = useTranslations('study.transitionPlan.objectives')
  const [creationModalOpened, setCreationModalOpened] = useState(false)

  const handleSuccess = () => {
    onTrajectoryCreation()
    setCreationModalOpened(false)
  }

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
      {canEdit && (
        <Button className={styles.addButton} onClick={() => setCreationModalOpened((prev) => !prev)}>
          {t('add')}
        </Button>
      )}

      {creationModalOpened && (
        <TrajectoryCreationModal
          open
          onClose={() => setCreationModalOpened(false)}
          transitionPlanId={transitionPlanId}
          onSuccess={handleSuccess}
          trajectory={null}
          isFirstCreation={false}
          studyYear={studyYear}
          sectenData={sectenData}
        />
      )}
    </div>
  )
}

export default ObjectivesFilters
