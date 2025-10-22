'use client'

import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import { MultiSelect } from '@/components/base/MultiSelect'
import PersistentToast from '@/components/base/PersistentToast'
import Title from '@/components/base/Title'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import Image from '@/components/document/Image'
import { FullStudy } from '@/db/study'
import { TrajectoryWithObjectives } from '@/db/trajectory'
import EnvironmentLoader from '@/environments/core/utils/EnvironmentLoader'
import { useServerFunction } from '@/hooks/useServerFunction'
import { getTrajectoriesForTransitionPlan } from '@/services/serverFunctions/trajectory'
import { getStudyTransitionPlan, initializeTransitionPlan } from '@/services/serverFunctions/transitionPlan'
import { getStudyTotalCo2EmissionsWithDep } from '@/services/study'
import {
  calculateCustomTrajectory,
  calculateSBTiTrajectory,
  SBTI_REDUCTION_RATE_15,
  SBTI_REDUCTION_RATE_WB2C,
} from '@/utils/trajectory'
import AddIcon from '@mui/icons-material/Add'
import { Typography } from '@mui/material'
import { TransitionPlan } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import MyTrajectoriesCard from '../study/trajectory/MyTrajectoriesCard'
import TrajectoryGraph from '../study/transitionPlan/TrajectoryGraph'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'
import styles from './TrajectoryReductionPage.module.css'

const TransitionPlanSelectionModal = dynamic(
  () => import('@/components/study/transitionPlan/TransitionPlanSelectionModal'),
  {
    ssr: false,
  },
)

const TrajectoryCreationModal = dynamic(() => import('@/components/study/trajectory/TrajectoryCreationModal'), {
  ssr: false,
})

const TRAJECTORY_15_ID = '1,5'
const TRAJECTORY_WB2C_ID = 'WB2C'

interface Props {
  study: FullStudy
  canEdit: boolean
}

const TrajectoryReductionPage = ({ study, canEdit }: Props) => {
  const t = useTranslations('study.transitionPlan')
  const tNav = useTranslations('nav')
  const router = useRouter()
  const tStudyNav = useTranslations('study.navigation')
  const [transitionPlan, setTransitionPlan] = useState<TransitionPlan | null | undefined>(undefined)
  const [showModal, setShowModal] = useState(false)
  const [showTrajectoryModal, setShowTrajectoryModal] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [loading, setLoading] = useState(true)
  const [customTrajectories, setCustomTrajectories] = useState<TrajectoryWithObjectives[]>([])
  const [selectedCustomTrajectoryIds, setSelectedCustomTrajectoryIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }
    const stored = localStorage.getItem(`trajectory-custom-selected-${study.id}`)
    return stored ? JSON.parse(stored) : []
  })
  const [selectedTrajectories, setSelectedTrajectories] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [TRAJECTORY_15_ID]
    }
    const stored = localStorage.getItem(`trajectory-sbti-selected-${study.id}`)
    return stored ? JSON.parse(stored) : [TRAJECTORY_15_ID]
  })
  const { callServerFunction } = useServerFunction()

  useEffect(() => {
    localStorage.setItem(`trajectory-sbti-selected-${study.id}`, JSON.stringify(selectedTrajectories))
  }, [selectedTrajectories, study.id])

  useEffect(() => {
    localStorage.setItem(`trajectory-custom-selected-${study.id}`, JSON.stringify(selectedCustomTrajectoryIds))
  }, [selectedCustomTrajectoryIds, study.id])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getStudyTransitionPlan(study)

        if (response.success && response.data) {
          setTransitionPlan(response.data)

          const trajectoriesResponse = await getTrajectoriesForTransitionPlan(response.data.id)
          if (trajectoriesResponse.success && trajectoriesResponse.data) {
            setCustomTrajectories(trajectoriesResponse.data)
          }
        } else {
          setTransitionPlan(null)
        }
      } catch (error) {
        console.error('Error fetching transition plan data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (transitionPlan === undefined) {
      fetchData()
    }
  }, [study, transitionPlan])

  const handleCreateTrajectorySuccess = useCallback(
    async (trajectoryId: string) => {
      setShowSuccessToast(true)
      if (transitionPlan) {
        const trajectoriesResponse = await getTrajectoriesForTransitionPlan(transitionPlan.id)
        if (trajectoriesResponse.success && trajectoriesResponse.data) {
          setCustomTrajectories(trajectoriesResponse.data)
          setSelectedCustomTrajectoryIds((prev) => [...prev, trajectoryId])
        }
      }
      router.refresh()
    },
    [router, transitionPlan],
  )

  const handleConfirmPlanSelection = useCallback(
    async (selectedPlanId?: string) => {
      await callServerFunction(() => initializeTransitionPlan(study.id, selectedPlanId), {
        onSuccess: async (data) => {
          setTransitionPlan(data)
          setShowModal(false)
          setCustomTrajectories(data.trajectories)
          router.refresh()
        },
      })
    },
    [callServerFunction, study.id, router],
  )

  const trajectoryData = useMemo(() => {
    if (!transitionPlan) {
      return {
        trajectory15: [],
        trajectoryWB2C: [],
        customTrajectories: [],
        studyStartYear: 0,
      }
    }

    const totalCo2 = getStudyTotalCo2EmissionsWithDep(study)
    const studyStartYear = study.startDate.getFullYear()

    const trajectoryWB2CData = calculateSBTiTrajectory({
      baseEmissions: totalCo2,
      studyStartYear,
      reductionRate: SBTI_REDUCTION_RATE_WB2C,
    })

    const maxYear =
      selectedTrajectories.includes(TRAJECTORY_WB2C_ID) && trajectoryWB2CData.length > 0
        ? trajectoryWB2CData[trajectoryWB2CData.length - 1].year
        : undefined

    const trajectory15Data = calculateSBTiTrajectory({
      baseEmissions: totalCo2,
      studyStartYear,
      reductionRate: SBTI_REDUCTION_RATE_15,
      maxYear,
    })

    const customTrajectoriesData = customTrajectories
      .filter((traj) => selectedCustomTrajectoryIds.includes(traj.id))
      .map((traj) => {
        let data: typeof trajectory15Data

        if (traj.type === 'SBTI_15') {
          data = calculateSBTiTrajectory({
            baseEmissions: totalCo2,
            studyStartYear,
            reductionRate: SBTI_REDUCTION_RATE_15,
          })
        } else if (traj.type === 'SBTI_WB2C') {
          data = calculateSBTiTrajectory({
            baseEmissions: totalCo2,
            studyStartYear,
            reductionRate: SBTI_REDUCTION_RATE_WB2C,
          })
        } else {
          data = calculateCustomTrajectory({
            baseEmissions: totalCo2,
            studyStartYear,
            objectives: traj.objectives.map((obj) => ({
              targetYear: obj.targetYear,
              reductionRate: Number(obj.reductionRate),
            })),
          })
        }

        return {
          data,
          enabled: true,
          label: traj.name,
          color: undefined,
        }
      })

    return {
      trajectory15: trajectory15Data,
      trajectoryWB2C: trajectoryWB2CData,
      customTrajectories: customTrajectoriesData,
      studyStartYear,
    }
  }, [selectedTrajectories, study, transitionPlan, customTrajectories, selectedCustomTrajectoryIds])

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
      <div className={classNames(styles.container, 'flex-col main-container p2 pt3')}>
        <Title title={t('trajectories.title')} as="h1" />

        <div className="flex-col gapped2">
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

          <div className={styles.trajectoryCardsGrid}>
            <Box className={classNames('p125', styles.trajectoryCard, styles.disabledCard)}>
              <Typography variant="h5" component="h2" fontWeight={600}>
                {t('trajectories.snbcButton')}
              </Typography>
            </Box>

            <Box className={classNames('p125 flex-col gapped075', styles.trajectoryCard)}>
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

            {customTrajectories.length === 0 ? (
              <Box
                className={classNames('p125 flex-col gapped075', styles.trajectoryCard, styles.clickableCard)}
                onClick={() => setShowTrajectoryModal(true)}
                role="button"
                tabIndex={0}
              >
                <div className="flex align-center gapped-2">
                  <AddIcon color="inherit" />
                  <Typography variant="h5" component="h2" fontWeight={600}>
                    {t('trajectories.customButton')}
                  </Typography>
                </div>
                <Typography variant="body1">{t('trajectories.customSubtitle')}</Typography>
              </Box>
            ) : (
              <MyTrajectoriesCard
                trajectories={customTrajectories}
                selectedTrajectoryIds={selectedCustomTrajectoryIds}
                onSelectionChange={setSelectedCustomTrajectoryIds}
                onAddTrajectory={() => setShowTrajectoryModal(true)}
                title={t('trajectories.myTrajectories')}
                addButtonLabel={t('trajectories.addTrajectory')}
                selectLabel={t('trajectories.selectTrajectories')}
              />
            )}
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
            customTrajectories={trajectoryData.customTrajectories}
            studyStartYear={trajectoryData.studyStartYear}
          />

          {transitionPlan && (
            <TrajectoryCreationModal
              open={showTrajectoryModal}
              onClose={() => setShowTrajectoryModal(false)}
              transitionPlanId={transitionPlan.id}
              onSuccess={handleCreateTrajectorySuccess}
            />
          )}

          {showSuccessToast && (
            <PersistentToast
              title={t('trajectoryModal.success')}
              subtitle={t.rich('trajectoryModal.successSubtitle', {
                link: (children) => <a href={`/etudes/${study.id}/objectifs`}>{children}</a>,
              })}
              onClose={() => setShowSuccessToast(false)}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default TrajectoryReductionPage
