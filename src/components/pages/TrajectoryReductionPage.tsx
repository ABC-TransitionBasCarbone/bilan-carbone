'use client'

import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import { MultiSelect } from '@/components/base/MultiSelect'
import PersistentToast from '@/components/base/PersistentToast'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import Image from '@/components/document/Image'
import { FullStudy } from '@/db/study'
import { TrajectoryWithObjectives } from '@/db/transitionPlan'
import { useLocalStorageSync } from '@/hooks/useLocalStorageSync'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteTransitionPlan, initializeTransitionPlan } from '@/services/serverFunctions/transitionPlan'
import { calculateTrajectoriesWithHistory, convertToPastStudies } from '@/utils/trajectory'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { Typography } from '@mui/material'
import { Action, ExternalStudy, TransitionPlan } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Block from '../base/Block'
import SelectStudySite from '../study/site/SelectStudySite'
import MyTrajectoriesCard from '../study/trajectory/MyTrajectoriesCard'
import LinkedStudies from '../study/transitionPlan/LinkedStudies'
import TrajectoryGraph from '../study/transitionPlan/TrajectoryGraph'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'
import styles from './TrajectoryReductionPage.module.css'

const TransitionPlanSelectionModal = dynamic(
  () => import('@/components/study/transitionPlan/TransitionPlanSelectionModal'),
)

const TrajectoryCreationModal = dynamic(() => import('@/components/study/trajectory/TrajectoryCreationModal'))
const ConfirmDeleteModal = dynamic(() => import('@/components/modals/ConfirmDeleteModal'))

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
  validatedOnly: boolean
}

const TrajectoryReductionPage = ({
  study,
  canEdit,
  transitionPlan,
  trajectories = [],
  linkedStudies = [],
  linkedExternalStudies = [],
  actions = [],
  validatedOnly,
}: Props) => {
  const t = useTranslations('study.transitionPlan')
  const tNav = useTranslations('nav')
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
  const tStudyNav = useTranslations('study.navigation')
  const [showModal, setShowModal] = useState(false)
  const [showTrajectoryModal, setShowTrajectoryModal] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [selectedCustomTrajectories, setSelectedCustomTrajectories] = useState<string[]>([])
  const [selectedSbtiTrajectories, setSelectedSbtiTrajectories] = useState<string[]>([TRAJECTORY_15_ID])
  const [withDependencies, setWithDependencies] = useState<boolean>(true)
  const [mounted, setMounted] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedCustom = localStorage.getItem(`trajectory-custom-selected-${study.id}`)
    if (storedCustom) {
      setSelectedCustomTrajectories(JSON.parse(storedCustom))
    }
    const storedSbti = localStorage.getItem(`trajectory-sbti-selected-${study.id}`)
    if (storedSbti) {
      setSelectedSbtiTrajectories(JSON.parse(storedSbti))
    }
    const storedDependencies = localStorage.getItem(`trajectory-with-dependencies-${study.id}`)
    if (storedDependencies) {
      setWithDependencies(JSON.parse(storedDependencies))
    }
  }, [study.id])

  useLocalStorageSync(`trajectory-sbti-selected-${study.id}`, selectedSbtiTrajectories, mounted)
  useLocalStorageSync(`trajectory-with-dependencies-${study.id}`, withDependencies, mounted)
  useLocalStorageSync(`trajectory-custom-selected-${study.id}`, selectedCustomTrajectories, mounted)

  // Local storage may keep leftover custom trajectory ids from previous transition plans
  // This ensures that displayed custom trajectories are always valid and cleans up the invalid ones
  useEffect(() => {
    if (trajectories.length > 0) {
      setSelectedCustomTrajectories((prev) => {
        const validIds = prev.filter((id) => trajectories.some((t) => t.id === id))
        if (validIds.length !== prev.length) {
          localStorage.setItem(`trajectory-custom-selected-${study.id}`, JSON.stringify(validIds))
        }
        return validIds
      })
    }
  }, [trajectories, study.id])

  const handleCreateTrajectorySuccess = useCallback(
    async (trajectoryId: string) => {
      router.refresh()
      if (trajectories.length === 0) {
        setShowSuccessToast(true)
      }
      setSelectedCustomTrajectories((prev) => [...prev, trajectoryId])
    },
    [router, trajectories.length],
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

  const handleConfirmDelete = useCallback(async () => {
    await callServerFunction(() => deleteTransitionPlan(study.id), {
      onSuccess: async () => {
        setShowDeleteModal(false)
        router.refresh()
      },
    })
  }, [callServerFunction, study.id, router])

  const pastStudies = useMemo(
    () => convertToPastStudies(linkedStudies, linkedExternalStudies, withDependencies, validatedOnly),
    [linkedStudies, linkedExternalStudies, withDependencies, validatedOnly],
  )

  const unvalidatedSourcesInfo = useMemo(() => {
    let totalCount = 0
    const currentStudyUnvalidatedCount = study.emissionSources.filter((source) => !source.validated).length

    totalCount += currentStudyUnvalidatedCount

    const linkedStudiesWithUnvalidatedSources = linkedStudies
      .map((linkedStudy) => {
        const unvalidatedCount = linkedStudy.emissionSources.filter((source) => !source.validated).length
        totalCount += unvalidatedCount
        return unvalidatedCount > 0
          ? {
              id: linkedStudy.id,
              name: linkedStudy.name,
              unvalidatedCount,
            }
          : null
      })
      .filter((study) => study !== null) as Array<{ id: string; name: string; unvalidatedCount: number }>

    return {
      currentStudyCount: currentStudyUnvalidatedCount,
      linkedStudies: linkedStudiesWithUnvalidatedSources,
      totalCount,
    }
  }, [study.emissionSources, linkedStudies])

  const trajectoryData = useMemo(() => {
    const studyStartYear = study.startDate.getFullYear()

    if (!transitionPlan) {
      return {
        trajectory15Data: null,
        trajectoryWB2CData: null,
        customTrajectoriesData: [],
        actionBasedTrajectoryData: null,
        studyStartYear,
      }
    }

    const trajectoryResult = calculateTrajectoriesWithHistory({
      study,
      withDependencies,
      validatedOnly,
      trajectories,
      actions,
      pastStudies,
      selectedSbtiTrajectories,
      selectedCustomTrajectoryIds: selectedCustomTrajectories,
    })

    const customTrajectoriesData = trajectoryResult.customTrajectories.map((trajData) => {
      const traj = trajectories.find((t) => t.id === trajData.id)
      return {
        trajectoryData: trajData.data,
        label: traj?.name || '',
        color: undefined,
      }
    })

    return {
      trajectory15Data: trajectoryResult.sbti15,
      trajectoryWB2CData: trajectoryResult.sbtiWB2C,
      customTrajectoriesData,
      actionBasedTrajectoryData: trajectoryResult.actionBased,
      studyStartYear,
    }
  }, [
    transitionPlan,
    study,
    withDependencies,
    validatedOnly,
    trajectories,
    actions,
    pastStudies,
    selectedSbtiTrajectories,
    selectedCustomTrajectories,
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
      <Block
        title={t('trajectories.title')}
        as="h2"
        rightComponent={<SelectStudySite sites={study.sites} siteSelectionDisabled isTransitionPlan />}
        actions={
          canEdit
            ? [
                {
                  actionType: 'button',
                  variant: 'contained',
                  color: 'error',
                  onClick: () => setShowDeleteModal(true),
                  title: t('trajectories.delete.title'),
                  children: <DeleteIcon />,
                },
              ]
            : undefined
        }
      >
        <div className="flex-col gapped2">
          <div className={classNames(styles.collapsibleBlocks, 'flex-col gapped0')}>
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

            <LinkedStudies
              transitionPlanId={transitionPlan.id}
              studyId={study.id}
              studyYear={study.startDate}
              pastStudies={pastStudies}
              canEdit={canEdit}
            />
          </div>

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
                canEdit={canEdit}
              />
            )}
          </div>

          <TrajectoryGraph
            studyName={study.name}
            trajectory15Data={trajectoryData.trajectory15Data}
            trajectoryWB2CData={trajectoryData.trajectoryWB2CData}
            customTrajectoriesData={trajectoryData.customTrajectoriesData}
            actionBasedTrajectoryData={trajectoryData.actionBasedTrajectoryData}
            studyStartYear={trajectoryData.studyStartYear}
            selectedSbtiTrajectories={selectedSbtiTrajectories}
            withDependencies={withDependencies}
            setWithDependencies={setWithDependencies}
            pastStudies={pastStudies}
            validatedOnly={validatedOnly}
            unvalidatedSourcesInfo={unvalidatedSourcesInfo}
          />

          {transitionPlan && (
            <TrajectoryCreationModal
              open={showTrajectoryModal}
              onClose={() => setShowTrajectoryModal(false)}
              transitionPlanId={transitionPlan.id}
              onSuccess={handleCreateTrajectorySuccess}
              trajectory={null}
              isFirstCreation={trajectories.length === 0}
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

        {showDeleteModal && (
          <ConfirmDeleteModal
            open={showDeleteModal}
            title={t('trajectories.delete.title')}
            message={t('trajectories.delete.description')}
            confirmText={t('trajectories.delete.confirm')}
            cancelText={t('trajectories.delete.cancel')}
            requireNameMatch={study.name}
            onConfirm={handleConfirmDelete}
            onCancel={() => setShowDeleteModal(false)}
          />
        )}
      </Block>
    </>
  )
}

export default TrajectoryReductionPage
