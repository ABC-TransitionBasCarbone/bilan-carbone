'use client'

import DebouncedInput from '@/components/base/DebouncedInput'
import MultiSelectAll from '@/components/base/MultiSelectAll'
import { EngagementActionSteps, EngagementActionTargets } from '@/constants/engagementActions'
import { EngagementActionWithSites } from '@/services/serverFunctions/study'
import { EngagementActionsFilters } from '@/types/filters'
import { FormControl, FormLabel } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { EngagementPhase } from '@repo/db-common'
import { Button } from '@repo/ui'
import dayjs, { Dayjs } from 'dayjs'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useMemo } from 'react'
import styles from './EngagementActionsFilters.module.css'

interface Props {
  filters: EngagementActionsFilters
  setFilters: Dispatch<SetStateAction<EngagementActionsFilters>>
  openAddModal: () => void
  canEdit: boolean
  actions: EngagementActionWithSites[]
}

const EngagementActionsFiltersComponent = ({ filters, setFilters, openAddModal, canEdit, actions }: Props) => {
  const t = useTranslations('study.engagementActions.filters')
  const tTable = useTranslations('study.engagementActions.table')
  const tCommonAction = useTranslations('common.action')
  const tCommonLabel = useTranslations('common.label')
  const tSteps = useTranslations('study.engagementActions.steps')
  const tTargets = useTranslations('study.engagementActions.targets')
  const tPhases = useTranslations('study.engagementActions.phases')

  const enumStepsValues = useMemo(() => Object.values(EngagementActionSteps) as string[], [])
  const stepsValues = useMemo(() => {
    const customSteps = Array.from(
      new Set(
        actions
          .flatMap((action) => action.steps || [])
          .filter((step) => !enumStepsValues.includes(step as EngagementActionSteps)),
      ),
    )
    return [...enumStepsValues, ...customSteps]
  }, [actions, enumStepsValues])
  const enumTargetsValues = useMemo(() => Object.values(EngagementActionTargets) as string[], [])
  const targetsValues = useMemo(() => {
    const customTargets = Array.from(
      new Set(
        actions
          .flatMap((action) => action.targets || [])
          .filter((target) => !enumTargetsValues.includes(target as EngagementActionTargets)),
      ),
    )
    return [...enumTargetsValues, ...customTargets]
  }, [actions, enumTargetsValues])
  const phasesValues = useMemo(() => Object.values(EngagementPhase) as string[], [])

  return (
    <div className="flex-row gapped-2 justify-between align-end">
      <div className="align-center wrap gapped-2">
        <FormControl>
          <FormLabel id="engagement-actions-filter-search" component="legend">
            {t('search')}
          </FormLabel>
          <DebouncedInput
            className={'grow'}
            debounce={500}
            value={filters.search}
            onChange={(newValue) => setFilters((prevFilters) => ({ ...prevFilters, search: newValue }))}
            placeholder={t('searchPlaceholder')}
          />
        </FormControl>

        <FormControl className={'grow'}>
          <FormLabel id="engagement-actions-steps-selector" component="legend">
            {tTable('steps')}
          </FormLabel>
          <MultiSelectAll
            id="engagement-actions-steps"
            values={Array.from(new Set(filters.steps as string[]))}
            allValues={stepsValues}
            setValues={(values) =>
              setFilters((prevFilters) => ({ ...prevFilters, steps: values as EngagementActionSteps[] }))
            }
            getLabel={(step) => (enumStepsValues.includes(step as EngagementActionSteps) ? tSteps(step) : step)}
          />
        </FormControl>

        <FormControl className={'grow'}>
          <FormLabel id="engagement-actions-targets-selector" component="legend">
            {tTable('target')}
          </FormLabel>
          <MultiSelectAll
            id="engagement-actions-targets"
            values={Array.from(new Set(filters.targets as string[]))}
            allValues={targetsValues}
            setValues={(values) => {
              setFilters((prevFilters) => ({
                ...prevFilters,
                targets: values as EngagementActionTargets[],
              }))
            }}
            getLabel={(target) =>
              enumTargetsValues.includes(target as EngagementActionTargets) ? tTargets(target) : target
            }
          />
        </FormControl>

        <FormControl className={'grow'}>
          <FormLabel id="engagement-actions-phases-selector" component="legend">
            {tTable('phase')}
          </FormLabel>
          <MultiSelectAll
            id="engagement-actions-phases"
            values={filters.phases as string[]}
            allValues={phasesValues}
            setValues={(values) => {
              setFilters((prevFilters) => ({
                ...prevFilters,
                phases: values as EngagementPhase[],
              }))
            }}
            getLabel={(phase) => tPhases(phase)}
          />
        </FormControl>

        <FormControl className={'grow'}>
          <FormLabel id="engagement-actions-start-date-selector" component="legend">
            {tCommonLabel('start')}
          </FormLabel>
          <DatePicker
            value={filters.dateRange.startDate ? dayjs(filters.dateRange.startDate) : null}
            onChange={(date: Dayjs | null) =>
              setFilters((prevFilters) => ({
                ...prevFilters,
                dateRange: {
                  ...prevFilters.dateRange,
                  startDate: date ? date.format('YYYY-MM-DD') : null,
                },
              }))
            }
          />
        </FormControl>

        <FormControl className={'grow'}>
          <FormLabel id="engagement-actions-end-date-selector" component="legend">
            {tCommonLabel('end')}
          </FormLabel>
          <DatePicker
            value={filters.dateRange.endDate ? dayjs(filters.dateRange.endDate) : null}
            onChange={(date: Dayjs | null) =>
              setFilters((prevFilters) => ({
                ...prevFilters,
                dateRange: {
                  ...prevFilters.dateRange,
                  endDate: date ? date.format('YYYY-MM-DD') : null,
                },
              }))
            }
          />
        </FormControl>
      </div>

      {canEdit && (
        <div className={'justify-end'}>
          <Button onClick={openAddModal} className={styles.addButton}>
            {tCommonAction('add')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default EngagementActionsFiltersComponent
