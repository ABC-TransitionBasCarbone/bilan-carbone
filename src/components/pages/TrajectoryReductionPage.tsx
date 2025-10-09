'use client'

import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import Image from '@/components/document/Image'
import { FullStudy } from '@/db/study'
import { TransitionPlanWithStudies } from '@/db/transitionPlan'
import EnvironmentLoader from '@/environments/core/utils/EnvironmentLoader'
import { useServerFunction } from '@/hooks/useServerFunction'
import {
  getAvailableTransitionPlans,
  getStudyTransitionPlan,
  initializeTransitionPlan,
} from '@/services/serverFunctions/transitionPlan'
import { getAccountRoleOnStudy, hasEditionRights } from '@/utils/study'
import { TransitionPlan } from '@prisma/client'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
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
  user: UserSession
}

const TrajectoryReductionPage = ({ study, user }: Props) => {
  const t = useTranslations('study.transitionPlan')
  const [transitionPlan, setTransitionPlan] = useState<TransitionPlan | null>(null)
  const [availablePlans, setAvailablePlans] = useState<TransitionPlanWithStudies[] | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const { callServerFunction } = useServerFunction()

  const userRoleOnStudy = getAccountRoleOnStudy(user, study)
  const canEdit = hasEditionRights(userRoleOnStudy)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const planResponse = await getStudyTransitionPlan(study.id)

        if (planResponse.success && planResponse.data) {
          setTransitionPlan(planResponse.data)
        } else {
          if (canEdit) {
            const plansResponse = await getAvailableTransitionPlans(study.id)
            if (plansResponse.success && plansResponse.data) {
              setAvailablePlans(plansResponse.data)
            }
            // Always show modal on first visit if user can edit
            setShowModal(true)
          }
        }
      } catch (error) {
        console.error('Error fetching transition plan data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!transitionPlan && !availablePlans) {
      fetchData()
    }
  }, [study.id, canEdit, transitionPlan, availablePlans])

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
              open={showModal}
              onClose={() => setShowModal(false)}
              availablePlans={availablePlans}
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

      {showModal && (
        <TransitionPlanSelectionModal
          open={showModal}
          onClose={() => setShowModal(false)}
          availablePlans={availablePlans}
          onConfirm={handleConfirmPlanSelection}
        />
      )}
    </div>
  )
}

export default TrajectoryReductionPage
