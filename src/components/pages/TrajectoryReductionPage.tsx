'use client'

import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import Image from '@/components/document/Image'
import { FullStudy } from '@/db/study'
import EnvironmentLoader from '@/environments/core/utils/EnvironmentLoader'
import { useServerFunction } from '@/hooks/useServerFunction'
import { getStudyTransitionPlan, initializeTransitionPlan } from '@/services/serverFunctions/transitionPlan'
import { TransitionPlan } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import styles from './TrajectoryReductionPage.module.css'

const TransitionPlanSelectionModal = dynamic(
  () => import('@/components/study/transitionPlan/TransitionPlanSelectionModal'),
  {
    ssr: false,
  },
)

interface Props {
  study: FullStudy
  canEdit: boolean
}

const TrajectoryReductionPage = ({ study, canEdit }: Props) => {
  const t = useTranslations('study.transitionPlan')
  const [transitionPlan, setTransitionPlan] = useState<TransitionPlan | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const { callServerFunction } = useServerFunction()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const planResponse = await getStudyTransitionPlan(study)

        if (planResponse.success && planResponse.data) {
          setTransitionPlan(planResponse.data)
        }
      } catch (error) {
        console.error('Error fetching transition plan data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (transitionPlan === null) {
      fetchData()
    }
  }, [study, transitionPlan])

  const handleConfirmPlanSelection = useCallback(
    async (selectedPlanId?: string) => {
      await callServerFunction(() => initializeTransitionPlan(study.id, selectedPlanId), {
        onSuccess: (data) => {
          setTransitionPlan(data)
          setShowModal(false)
        },
      })
    },
    [callServerFunction, study.id],
  )

  if (loading) {
    return (
      <div className={classNames(styles.container, 'flex-cc')}>
        <EnvironmentLoader />
      </div>
    )
  }

  if (!transitionPlan) {
    if (canEdit) {
      return (
        <div className={classNames(styles.container, 'flex-cc', 'w100')}>
          <Box className={classNames(styles.emptyStateCard, 'flex-col align-center')}>
            <Image src="/img/CR.png" alt="Transition Plan" width={177} height={119} />
            <h5>{t('emptyState.title')}</h5>
            <p>{t('emptyState.subtitle')}</p>
            <Button onClick={() => setShowModal(true)} size="large" className={'mt-2'}>
              {t('startButton')}
            </Button>
          </Box>

          {showModal && (
            <TransitionPlanSelectionModal
              studyId={study.id}
              open={showModal}
              onClose={() => setShowModal(false)}
              onConfirm={handleConfirmPlanSelection}
            />
          )}
        </div>
      )
    } else {
      return (
        <div className={classNames(styles.container, 'flex-cc')}>
          <Box className={classNames(styles.emptyStateCard, 'flex-col align-center')}>
            <Image src="/img/CR.png" alt="Transition Plan not initialized" width={177} height={119} />
            <h5>{t('notInitialized')}</h5>
            <p>{t('validatorRequired')}</p>
          </Box>
        </div>
      )
    }
  }

  return (
    <div className={classNames(styles.container, 'p2')}>
      <h1>Plan de Transition</h1>
      {/* TODO: Remove this once we have a proper page */}
      <div className={styles.debugContainer}>
        <h2>Plan de transition (debug)</h2>
        <pre className={styles.debugJson}>{JSON.stringify(transitionPlan, null, 2)}</pre>
      </div>
    </div>
  )
}

export default TrajectoryReductionPage
