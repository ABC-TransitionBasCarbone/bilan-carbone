'use client'

import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import Title from '@/components/base/Title'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import Image from '@/components/document/Image'
import { FullStudy } from '@/db/study'
import EnvironmentLoader from '@/environments/core/utils/EnvironmentLoader'
import { useServerFunction } from '@/hooks/useServerFunction'
import { getStudyTransitionPlan, initializeTransitionPlan } from '@/services/serverFunctions/transitionPlan'
import { TransitionPlan } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'
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
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')
  const router = useRouter()
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
          router.refresh()
        },
      })
    },
    [callServerFunction, study.id, router],
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
    <>
      <Breadcrumbs
        current={tStudyNav('trajectories')}
        links={[
          { label: tNav('home'), link: '/' },
          study.organizationVersion.isCR
            ? {
                label: study.organizationVersion.organization.name,
                link: `/organisations/${study.organizationVersion.id}`,
              }
            : undefined,
          { label: study.name, link: `/etudes/${study.id}` },
        ].filter((link) => link !== undefined)}
      />
      <div className={classNames(styles.container, 'main-container', 'p2', 'pt3')}>
        <Title title={t('trajectories.title')} as="h1" />

        <TransitionPlanOnboarding
          title={t('trajectories.onboarding.title')}
          description={t('trajectories.onboarding.description')}
          storageKey="trajectory-reduction"
          detailedContent={t.rich('trajectories.onboarding.detailedInfo', {
            br: () => <br />,
            snbc: (chunks) => (
              <a href={process.env.NEXT_PUBLIC_SNBC_URL || '#'} target="_blank" rel="noopener noreferrer">
                {chunks}
              </a>
            ),
            sbti: (chunks) => (
              <a href={process.env.NEXT_PUBLIC_SBTI_URL || '#'} target="_blank" rel="noopener noreferrer">
                {chunks}
              </a>
            ),
          })}
        />
      </div>
    </>
  )
}

export default TrajectoryReductionPage
