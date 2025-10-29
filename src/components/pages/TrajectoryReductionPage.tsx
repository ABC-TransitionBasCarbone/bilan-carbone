'use client'

import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import { MultiSelect } from '@/components/base/MultiSelect'
import PersistentToast from '@/components/base/PersistentToast'
import Title from '@/components/base/Title'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import Image from '@/components/document/Image'
import { FullStudy } from '@/db/study'
import { TrajectoryWithObjectives } from '@/db/transitionPlan'
import { useServerFunction } from '@/hooks/useServerFunction'
import { initializeTransitionPlan } from '@/services/serverFunctions/transitionPlan'
import { getStudyTotalCo2EmissionsWithDep } from '@/services/study'
import {
  calculateActionBasedTrajectory,
  calculateCustomTrajectory,
  calculateSBTiTrajectory,
  SBTI_REDUCTION_RATE_15,
  SBTI_REDUCTION_RATE_WB2C,
} from '@/utils/trajectory'
import AddIcon from '@mui/icons-material/Add'
import { Typography } from '@mui/material'
import { Action, ExternalStudy, TransitionPlan } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import MyTrajectoriesCard from '../study/trajectory/MyTrajectoriesCard'
import LinkedStudies from '../study/transitionPlan/LinkedStudies'
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
  transitionPlan: TransitionPlan | null
  trajectories?: TrajectoryWithObjectives[]
  linkedStudies?: FullStudy[]
  linkedExternalStudies?: ExternalStudy[]
  actions?: Action[]
}

const TrajectoryReductionPage = ({
  study,
  canEdit,
  transitionPlan,
  trajectories = [],
  linkedStudies = [],
  linkedExternalStudies = [],
  actions = [],
}: Props) => {
  const t = useTranslations('study.transitionPlan')
  const tNav = useTranslations('nav')
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
  const tStudyNav = useTranslations('study.navigation')
  const [showModal, setShowModal] = useState(false)
  const [showTrajectoryModal, setShowTrajectoryModal] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [selectedCustomTrajectories, setSelectedCustomTrajectories] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }
    const stored = localStorage.getItem(`trajectory-custom-selected-${study.id}`)
    return stored ? JSON.parse(stored) : []
  })
  const [selectedSbtiTrajectories, setSelectedSbtiTrajectories] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [TRAJECTORY_15_ID]
    }
    const stored = localStorage.getItem(`trajectory-sbti-selected-${study.id}`)
    return stored ? JSON.parse(stored) : [TRAJECTORY_15_ID]
  })

  useEffect(() => {
    localStorage.setItem(`trajectory-sbti-selected-${study.id}`, JSON.stringify(selectedSbtiTrajectories))
  }, [selectedSbtiTrajectories, study.id])

  useEffect(() => {
    localStorage.setItem(`trajectory-custom-selected-${study.id}`, JSON.stringify(selectedCustomTrajectories))
  }, [selectedCustomTrajectories, study.id])

  // Local storage may keep leftover custom trajectory ids from previous transition plans
  // This ensures that the selected custom trajectories are always valid
  useEffect(() => {
    if (trajectories.length > 0) {
      setSelectedCustomTrajectories((prev) => prev.filter((id) => trajectories.some((t) => t.id === id)))
    }
  }, [trajectories])

  const handleCreateTrajectorySuccess = useCallback(
    async (trajectoryId: string) => {
      router.refresh()
      setShowSuccessToast(true)
      setSelectedCustomTrajectories((prev) => [...prev, trajectoryId])
    },
    [router],
  )

  const handleConfirmPlanSelection = useCallback(
    async (selectedPlanId?: string) => {
      await callServerFunction(() => initializeTransitionPlan(study.id, selectedPlanId), {
        onSuccess: async () => {
          setShowModal(false)
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
        actionBasedTrajectory: [],
        studyStartYear: 0,
      }
    }

    const totalCo2 = getStudyTotalCo2EmissionsWithDep(study)
    const studyStartYear = study.startDate.getFullYear()

    const enabledActions = actions.filter((action) => action.enabled)

    const trajectoryWB2CData = calculateSBTiTrajectory({
      studyEmissions: totalCo2,
      studyStartYear,
      reductionRate: SBTI_REDUCTION_RATE_WB2C,
    })

    let maxYear =
      selectedSbtiTrajectories.includes(TRAJECTORY_WB2C_ID) && trajectoryWB2CData.length > 0
        ? trajectoryWB2CData[trajectoryWB2CData.length - 1].year
        : undefined

    const trajectory15Data = calculateSBTiTrajectory({
      studyEmissions: totalCo2,
      studyStartYear,
      reductionRate: SBTI_REDUCTION_RATE_15,
      maxYear,
      linkedStudies,
      externalStudies: linkedExternalStudies,
    })

    const customTrajectoriesData = trajectories
      .filter((traj) => selectedCustomTrajectories.includes(traj.id))
      .map((traj) => {
        let data: typeof trajectory15Data

        if (traj.type === 'SBTI_15') {
          data = calculateSBTiTrajectory({
            studyEmissions: totalCo2,
            studyStartYear,
            reductionRate: SBTI_REDUCTION_RATE_15,
            linkedStudies,
            externalStudies: linkedExternalStudies,
          })
        } else if (traj.type === 'SBTI_WB2C') {
          data = calculateSBTiTrajectory({
            studyEmissions: totalCo2,
            studyStartYear,
            reductionRate: SBTI_REDUCTION_RATE_WB2C,
            linkedStudies,
            externalStudies: linkedExternalStudies,
          })
        } else {
          data = calculateCustomTrajectory({
            studyEmissions: totalCo2,
            studyStartYear,
            objectives: traj.objectives.map((obj) => ({
              targetYear: obj.targetYear,
              reductionRate: Number(obj.reductionRate),
            })),
            linkedStudies,
            externalStudies: linkedExternalStudies,
          })
        }

        return {
          data,
          enabled: true,
          label: traj.name,
          color: undefined,
        }
      })

    const customTrajectoriesMaxYear = customTrajectoriesData.reduce((max, traj) => {
      const lastYear = traj.data.length > 0 ? traj.data[traj.data.length - 1].year : 0
      return lastYear > max ? lastYear : max
    }, 0)

    maxYear = Math.max(maxYear ?? 0, customTrajectoriesMaxYear)

    const actionBasedTrajectoryData = calculateActionBasedTrajectory({
      studyEmissions: totalCo2,
      studyStartYear,
      actions: enabledActions,
      linkedStudies,
      externalStudies: linkedExternalStudies,
      maxYear,
    })

    return {
      trajectory15: trajectory15Data,
      trajectoryWB2C: trajectoryWB2CData,
      customTrajectories: customTrajectoriesData,
      actionBasedTrajectory: actionBasedTrajectoryData,
      studyStartYear,
    }
  }, [
    selectedSbtiTrajectories,
    study,
    transitionPlan,
    trajectories,
    selectedCustomTrajectories,
    linkedStudies,
    linkedExternalStudies,
    actions,
  ])

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

            <Box className={classNames('p125 flex-col justify-between gapped2', styles.trajectoryCard)}>
              <div className="flex-col gapped-2">
                <Typography variant="h5" component="h2" fontWeight={600}>
                  {t('trajectories.sbtiCard.title')}
                </Typography>
                <Typography variant="body1">{t('trajectories.sbtiCard.description')}</Typography>
              </div>

              <div className="w100 flex-col gapped-2">
                <MultiSelect
                  label={t('trajectories.sbtiCard.methodLabel')}
                  value={selectedSbtiTrajectories}
                  onChange={setSelectedSbtiTrajectories}
                  options={[
                    { label: t('trajectories.sbtiCard.option15'), value: TRAJECTORY_15_ID },
                    { label: t('trajectories.sbtiCard.optionWB2C'), value: TRAJECTORY_WB2C_ID },
                  ]}
                  placeholder={t('trajectories.sbtiCard.placeholder')}
                />
              </div>
            </Box>

            {trajectories.length === 0 ? (
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
                trajectories={trajectories}
                selectedTrajectoryIds={selectedCustomTrajectories}
                onSelectionChange={setSelectedCustomTrajectories}
                onAddTrajectory={() => setShowTrajectoryModal(true)}
                title={t('trajectories.myTrajectories')}
                addButtonLabel={t('trajectories.addTrajectory')}
                selectLabel={t('trajectories.selectTrajectories')}
              />
            )}
          </div>

          <LinkedStudies
            transitionPlanId={transitionPlan.id}
            studyId={study.id}
            studyYear={study.startDate}
            linkedStudies={linkedStudies}
            externalStudies={linkedExternalStudies}
          />

          <TrajectoryGraph
            trajectory15={{
              data: trajectoryData.trajectory15,
              enabled: selectedSbtiTrajectories.includes(TRAJECTORY_15_ID),
            }}
            trajectoryWB2C={{
              data: trajectoryData.trajectoryWB2C,
              enabled: selectedSbtiTrajectories.includes(TRAJECTORY_WB2C_ID),
            }}
            customTrajectories={trajectoryData.customTrajectories}
            actionBasedTrajectory={{
              data: trajectoryData.actionBasedTrajectory,
              enabled: true,
            }}
            studyStartYear={trajectoryData.studyStartYear}
          />

          {transitionPlan && (
            <TrajectoryCreationModal
              open={showTrajectoryModal}
              onClose={() => setShowTrajectoryModal(false)}
              transitionPlanId={transitionPlan.id}
              onSuccess={handleCreateTrajectorySuccess}
              trajectory={null}
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
