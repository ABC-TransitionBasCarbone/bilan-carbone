'use client'

import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import { MultiSelect } from '@/components/base/MultiSelect'
import Title from '@/components/base/Title'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import Image from '@/components/document/Image'
import { FullStudy } from '@/db/study'
import EnvironmentLoader from '@/environments/core/utils/EnvironmentLoader'
import { useServerFunction } from '@/hooks/useServerFunction'
import { getEmissionResults, getEmissionSourcesTotalCo2 } from '@/services/emissionSource'
import { getStudyTransitionPlan, initializeTransitionPlan } from '@/services/serverFunctions/transitionPlan'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { calculateTrajectory, SBTI_REDUCTION_RATE_15, SBTI_REDUCTION_RATE_WB2C } from '@/utils/trajectory'
import { Typography } from '@mui/material'
import { TransitionPlan } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import TrajectoryGraph from '../study/transitionPlan/TrajectoryGraph'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'
import styles from './TrajectoryReductionPage.module.css'

const TransitionPlanSelectionModal = dynamic(
  () => import('@/components/study/transitionPlan/TransitionPlanSelectionModal'),
  {
    ssr: false,
  },
)

const TRAJECTORY_15_ID = '1,5'
const TRAJECTORY_WB2C_ID = 'WB2C'

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
  const [selectedTrajectories, setSelectedTrajectories] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [TRAJECTORY_15_ID]
    }
    const stored = localStorage.getItem('trajectory-sbti-selected')
    return stored ? JSON.parse(stored) : [TRAJECTORY_15_ID]
  })
  const { callServerFunction } = useServerFunction()

  useEffect(() => {
    localStorage.setItem('trajectory-sbti-selected', JSON.stringify(selectedTrajectories))
  }, [selectedTrajectories])

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

  const trajectoryData = useMemo(() => {
    const environment = study.organizationVersion.environment

    const emissionSourcesWithEmission = study.emissionSources.map((emissionSource) => ({
      ...emissionSource,
      ...getEmissionResults(emissionSource, environment),
    }))

    const totalCo2InKg = getEmissionSourcesTotalCo2(emissionSourcesWithEmission)
    const totalCo2 = totalCo2InKg / STUDY_UNIT_VALUES[study.resultsUnit]
    const studyStartYear = study.startDate.getFullYear()

    const trajectory15Data = calculateTrajectory({
      baseEmissions: totalCo2,
      studyStartYear,
      reductionRate: SBTI_REDUCTION_RATE_15,
    })

    const trajectoryWB2CData = calculateTrajectory({
      baseEmissions: totalCo2,
      studyStartYear,
      reductionRate: SBTI_REDUCTION_RATE_WB2C,
    })

    return {
      trajectory15: trajectory15Data,
      trajectoryWB2C: trajectoryWB2CData,
      studyStartYear,
    }
  }, [study.emissionSources, study.startDate, study.resultsUnit, study.organizationVersion.environment])

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
        <div className={classNames(styles.container, 'flex-cc w100')}>
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
      <div className={classNames(styles.container, 'flex-col gapped2 main-container p2 pt3')}>
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

        <div className={'flex wrap gapped1'}>
          <Box className={classNames('grow p125', styles.trajectoryCard, styles.disabledCard)}>
            <Typography variant="h5" component="h2" fontWeight={600}>
              {t('trajectories.snbcButton')}
            </Typography>
          </Box>

          <Box className={classNames('grow p125 flex-col gapped075', styles.trajectoryCard)}>
            <Typography variant="h5" component="h2" fontWeight={600}>
              {t('trajectories.sbtiCard.title')}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {t('trajectories.sbtiCard.description')}
            </Typography>

            <div className={'w100 flex-col gapped075'}>
              <MultiSelect
                label={t('trajectories.sbtiCard.methodLabel')}
                value={selectedTrajectories}
                onChange={setSelectedTrajectories}
                options={[
                  { label: t('trajectories.sbtiCard.option15'), value: TRAJECTORY_15_ID },
                  { label: t('trajectories.sbtiCard.optionWB2C'), value: TRAJECTORY_WB2C_ID },
                ]}
                placeholder={t('trajectories.sbtiCard.placeholder')}
              />
            </div>
          </Box>

          <Box className={classNames('grow p125', styles.trajectoryCard, styles.disabledCard)}>
            <Typography variant="h5" component="h2" fontWeight={600}>
              {t('trajectories.customButton')}
            </Typography>
          </Box>
        </div>

        <TrajectoryGraph
          trajectory15={{
            data: trajectoryData.trajectory15,
            enabled: selectedTrajectories.includes(TRAJECTORY_15_ID),
          }}
          trajectoryWB2C={{
            data: trajectoryData.trajectoryWB2C,
            enabled: selectedTrajectories.includes(TRAJECTORY_WB2C_ID),
          }}
          studyStartYear={trajectoryData.studyStartYear}
        />
      </div>
    </>
  )
}

export default TrajectoryReductionPage
