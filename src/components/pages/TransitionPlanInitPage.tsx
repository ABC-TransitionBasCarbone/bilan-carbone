'use client'

import Block from '@/components/base/Block'
import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import Image from '@/components/document/Image'
import LinkedStudies from '@/components/study/transitionPlan/LinkedStudies'
import OnboardingSectionStep from '@/components/study/transitionPlan/OnboardingSectionStep'
import SectorAllocationBlock from '@/components/study/transitionPlan/SectorAllocationBlock'
import TrajectoryGraph from '@/components/study/transitionPlan/TrajectoryGraph'
import TransitionPlanFilters from '@/components/study/transitionPlan/TransitionPlanFilters'
import { TRAJECTORY_15_ID, TRAJECTORY_SNBC_GENERAL_ID } from '@/constants/trajectories'
import { FullStudy } from '@/db/study'
import { TrajectoryWithObjectivesAndScope } from '@/db/transitionPlan'
import { useLocalStorageSync } from '@/hooks/useLocalStorageSync'
import { useServerFunction } from '@/hooks/useServerFunction'
import { useTransitionPlanFilters } from '@/hooks/useTransitionPlanFilters'
import { customRich } from '@/i18n/customRich'
import { SectorPercentages } from '@/services/serverFunctions/trajectory.command'
import { createTrajectoryWithObjectives, updateTrajectory } from '@/services/serverFunctions/trajectory.serverFunction'
import { deleteTransitionPlan, initializeTransitionPlan } from '@/services/serverFunctions/transitionPlan'
import { getStudyTotalCo2Emissions } from '@/services/study'
import { calculateSectoralSNBCReductionRates } from '@/utils/snbc'
import { getUIFilteredEmissions } from '@/utils/study'
import { convertToPastStudies, getDefaultSnbcSectoralTrajectory } from '@/utils/trajectory'
import DeleteIcon from '@mui/icons-material/Delete'
import type { ExternalStudy, SectenInfo, TransitionPlan } from '@prisma/client'
import { SubPost, TrajectoryType } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ReferenceTrajectorySelectionSection } from '../study/transitionPlan/ReferenceTrajectorySelectionSection'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'
import styles from './TransitionPlanInitPage.module.css'

const TransitionPlanSelectionModal = dynamic(
  () => import('@/components/study/transitionPlan/TransitionPlanSelectionModal'),
)
const ConfirmDeleteModal = dynamic(() => import('@/components/modals/ConfirmDeleteModal'))

const TOTAL_STEPS = 4

interface Props {
  study: FullStudy
  canEdit: boolean
  transitionPlan: TransitionPlan | null
  trajectories: TrajectoryWithObjectivesAndScope[]
  linkedStudies: FullStudy[]
  linkedExternalStudies: ExternalStudy[]
  validatedOnly: boolean
  sectenData: SectenInfo[]
}

const TransitionPlanInitPage = ({
  study,
  canEdit,
  transitionPlan,
  trajectories,
  linkedStudies,
  linkedExternalStudies,
  validatedOnly,
  sectenData,
}: Props) => {
  const t = useTranslations('study.transitionPlan')
  const tBlock = useTranslations('study.transitionPlan.initialization.sectorBlock')
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<number | 'complete'>(-1)
  const [selectedSnbcTrajectories, setSelectedSnbcTrajectories] = useState<string[]>([TRAJECTORY_SNBC_GENERAL_ID])
  const [selectedSbtiTrajectories, setSelectedSbtiTrajectories] = useState<string[]>([TRAJECTORY_15_ID])
  const [snbcMounted, setSnbcMounted] = useState(false)
  const {
    selectedSiteIds,
    selectedPostIds,
    selectedTagIds,
    filtersMounted,
    setSelectedSiteIds,
    setSelectedPostIds,
    setSelectedTagIds,
  } = useTransitionPlanFilters(study.id)

  const storageKey = `transition-init-step-${study.id}`
  const isComplete = currentStep === 'complete'

  useLocalStorageSync(`trajectory-sbti-selected-${study.id}`, selectedSbtiTrajectories, snbcMounted)
  useLocalStorageSync(`trajectory-snbc-selected-${study.id}`, selectedSnbcTrajectories, snbcMounted)

  const handleConfirmPlanSelection = useCallback(
    async (selectedPlanId?: string) => {
      await callServerFunction(() => initializeTransitionPlan(study.id, selectedPlanId), {
        onSuccess: async () => {
          setShowModal(false)
          setIsLoading(true)
          router.refresh()
        },
      })
    },
    [callServerFunction, study.id, router],
  )

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored !== null && stored !== 'complete') {
      setCurrentStep(parseInt(stored, 10))
      return
    }

    if (stored === 'complete' || trajectories.length > 0) {
      localStorage.setItem(storageKey, 'complete')
      setCurrentStep('complete')
      return
    }
    setCurrentStep(0)
  }, [storageKey, trajectories.length])

  const validateStep = useCallback(
    (step: number) => {
      if (canEdit && !isComplete) {
        const next = step + 1
        if (next >= TOTAL_STEPS) {
          localStorage.setItem(storageKey, 'complete')
          setCurrentStep('complete')
        } else {
          localStorage.setItem(storageKey, String(next))
          setCurrentStep(next)
        }
      }
    },
    [storageKey, canEdit, isComplete],
  )

  const isStepVisible = (step: number) => {
    if (isComplete) {
      return true
    }
    return step <= currentStep
  }

  const isStepActive = (step: number) => {
    if (isComplete) {
      return false
    }
    return step === currentStep
  }

  useEffect(() => {
    setSnbcMounted(true)
    const storedSnbc = localStorage.getItem(`trajectory-snbc-selected-${study.id}`)
    if (storedSnbc) {
      setSelectedSnbcTrajectories(JSON.parse(storedSnbc))
    }

    const storedSbti = localStorage.getItem(`trajectory-sbti-selected-${study.id}`)
    if (storedSbti) {
      setSelectedSbtiTrajectories(JSON.parse(storedSbti))
    }
  }, [study.id])

  const defaultSnbcSectoralTrajectory = useMemo(() => getDefaultSnbcSectoralTrajectory(trajectories), [trajectories])

  const pastStudies = useMemo(
    () => convertToPastStudies(linkedStudies, linkedExternalStudies, validatedOnly, study.resultsUnit),
    [linkedStudies, linkedExternalStudies, validatedOnly, study.resultsUnit],
  )

  const studyTotalEmissions = useMemo(() => {
    return getStudyTotalCo2Emissions(study, true, validatedOnly)
  }, [study, validatedOnly])

  const filteredStudyEmissions = useMemo(() => {
    const subPosts = selectedPostIds.filter((id): id is SubPost => Object.values(SubPost).includes(id as SubPost))
    return getUIFilteredEmissions(study, validatedOnly, selectedSiteIds, subPosts, selectedTagIds)
  }, [study, validatedOnly, selectedSiteIds, selectedPostIds, selectedTagIds])

  const filterRatio = studyTotalEmissions > 0 ? filteredStudyEmissions / studyTotalEmissions : 1

  const filteredPastStudies = useMemo(
    () => pastStudies.map((ps) => ({ ...ps, totalCo2: ps.totalCo2 * filterRatio })),
    [pastStudies, filterRatio],
  )

  const handleConfirmDelete = useCallback(async () => {
    await callServerFunction(() => deleteTransitionPlan(study.id), {
      onSuccess: async () => {
        setShowDeleteModal(false)
        router.refresh()
      },
    })
  }, [callServerFunction, study.id, router])

  const handleSaveTrajectory = useCallback(
    async (sectorPercentages: SectorPercentages) => {
      if (!transitionPlan) {
        return
      }

      const rates = calculateSectoralSNBCReductionRates(
        {
          studyEmissions: studyTotalEmissions,
          studyStartYear: study.startDate.getFullYear(),
          sectenData,
          pastStudies,
        },
        sectorPercentages,
      )

      const objectives: { targetYear: number; reductionRate: number }[] = []
      if (rates) {
        if (rates.rateTo2015 !== undefined) {
          objectives.push({ targetYear: 2015, reductionRate: rates.rateTo2015 })
        }
        objectives.push({ targetYear: 2030, reductionRate: rates.rateTo2030 })
        objectives.push({ targetYear: 2050, reductionRate: rates.rateTo2050 })
      }

      if (defaultSnbcSectoralTrajectory) {
        const defaultObjectives = defaultSnbcSectoralTrajectory.objectives.filter((obj) => obj.isDefault)
        await callServerFunction(
          () =>
            updateTrajectory(defaultSnbcSectoralTrajectory.id, {
              sectorPercentages,
              objectives: objectives.map((obj, index) => ({
                id: defaultObjectives[index]?.id,
                targetYear: obj.targetYear,
                reductionRate: Number(obj.reductionRate.toFixed(4)),
              })),
            }),
          { onSuccess: () => router.refresh() },
        )
      } else {
        await callServerFunction(
          () =>
            createTrajectoryWithObjectives({
              transitionPlanId: transitionPlan.id,
              name: tBlock('snbcSectorialName'),
              type: TrajectoryType.SNBC_SECTORAL,
              sectorPercentages,
              isDefault: true,
              objectives,
            }),
          { onSuccess: () => router.refresh() },
        )
      }
    },
    [
      transitionPlan,
      defaultSnbcSectoralTrajectory,
      studyTotalEmissions,
      study.startDate,
      sectenData,
      pastStudies,
      callServerFunction,
      tBlock,
      router,
    ],
  )

  if (!transitionPlan) {
    if (canEdit) {
      return (
        <div className={classNames(styles.container, 'flex-cc w100')}>
          <Box className={classNames(styles.emptyStateCard, 'flex-col align-center gapped1')}>
            <Image src="/img/CR.png" alt="Transition Plan" width={177} height={119} />
            <h5>{t('emptyState.title')}</h5>
            <p>{customRich(t, 'emptyState.subtitle')}</p>
            <Button onClick={() => setShowModal(true)} size="large" className={'mt-2'} disabled={isLoading}>
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
    }
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

  return (
    <>
      <Breadcrumbs
        current={tStudyNav('initialization')}
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
        title={t('initialization.title')}
        as="h2"
        actions={
          canEdit && transitionPlan
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
        <div className="flex-col gapped15">
          <TransitionPlanOnboarding
            title={t('initialization.onboarding.title')}
            description={t('initialization.onboarding.description')}
            storageKey="transition-plan-initialization"
            detailedContent={t('initialization.onboarding.detailedInfo')}
          />

          {/* Step 1 – Past studies */}
          <LinkedStudies
            transitionPlanId={transitionPlan.id}
            studyId={study.id}
            studyYear={study.startDate}
            pastStudies={pastStudies}
            canEdit={canEdit}
            studyUnit={study.resultsUnit}
            isVisible={isStepVisible(0)}
            isActive={isStepActive(0)}
            onClickNext={() => validateStep(0)}
          />

          {/* Step 2 – Sector percentages */}
          <SectorAllocationBlock
            canEdit={canEdit}
            defaultSnbcSectoralTrajectory={defaultSnbcSectoralTrajectory}
            study={study}
            pastStudies={pastStudies}
            sectenData={sectenData}
            validatedOnly={validatedOnly}
            isVisible={isStepVisible(1)}
            isActive={isStepActive(1)}
            onClickNext={() => validateStep(1)}
            onSaveTrajectory={handleSaveTrajectory}
          />

          {/* Step 3 – SNBC + SBTI selection */}
          <OnboardingSectionStep
            title={t('initialization.stepSelectReferenceTrajectories.title')}
            description={t('initialization.stepSelectReferenceTrajectories.description')}
            glossaryLabel="init-step-select-reference-trajectories"
            glossaryTitleKey="glossaryTitle"
            tModal="study.transitionPlan.initialization.stepSelectReferenceTrajectories"
            isVisible={isStepVisible(2)}
            isActive={isStepActive(2)}
            onClickNext={() => validateStep(2)}
            showNextButton={isStepActive(2)}
          >
            <ReferenceTrajectorySelectionSection
              selectedSnbcTrajectories={selectedSnbcTrajectories}
              setSelectedSnbcTrajectories={setSelectedSnbcTrajectories}
              selectedSbtiTrajectories={selectedSbtiTrajectories}
              setSelectedSbtiTrajectories={setSelectedSbtiTrajectories}
              customSnbcSectoralTrajectory={defaultSnbcSectoralTrajectory}
            />
          </OnboardingSectionStep>

          {/* Step 4 – Reference graph */}
          <OnboardingSectionStep
            title={t('initialization.stepVisualization.title')}
            description={t('initialization.stepVisualization.description')}
            glossaryLabel="init-step-visualization"
            glossaryTitleKey="glossaryTitle"
            tModal="study.transitionPlan.initialization.stepVisualization"
            isVisible={isStepVisible(3)}
            isActive={isStepActive(3)}
            onClickNext={() => {
              validateStep(3)
              router.push(`/etudes/${study.id}/trajectoires?openModal=true`)
            }}
            nextButtonLabel={t('initialization.createButton')}
            showNextButton={isStepActive(3)}
          >
            <TransitionPlanFilters
              study={study}
              selectedSiteIds={selectedSiteIds}
              selectedPostIds={selectedPostIds}
              selectedTagIds={selectedTagIds}
              onSiteFilterChange={setSelectedSiteIds}
              onPostFilterChange={setSelectedPostIds}
              onTagFilterChange={setSelectedTagIds}
              filtersMounted={filtersMounted}
            />
            <TrajectoryGraph
              study={study}
              studyEmissions={filteredStudyEmissions}
              linkedStudies={linkedStudies}
              sectenData={sectenData}
              trajectories={defaultSnbcSectoralTrajectory ? [defaultSnbcSectoralTrajectory] : []}
              actions={[]}
              selectedSnbcTrajectories={selectedSnbcTrajectories.filter(
                (id) => id !== defaultSnbcSectoralTrajectory?.id,
              )}
              selectedSbtiTrajectories={selectedSbtiTrajectories}
              selectedCustomTrajectories={
                defaultSnbcSectoralTrajectory && selectedSnbcTrajectories.includes(defaultSnbcSectoralTrajectory.id)
                  ? [defaultSnbcSectoralTrajectory.id]
                  : []
              }
              pastStudies={filteredPastStudies}
              validatedOnly={validatedOnly}
              showTitle={false}
              showActionTrajectory={false}
              storageKey={`transition-plan-init-${transitionPlan!.id}`}
            />
          </OnboardingSectionStep>
          {!isComplete && (
            <div className={'flex-cc'}>
              <Button
                variant="text"
                onClick={async () => {
                  if (canEdit && !defaultSnbcSectoralTrajectory) {
                    await handleSaveTrajectory({
                      energy: 0,
                      industry: 0,
                      waste: 0,
                      buildings: 0,
                      agriculture: 0,
                      transportation: 0,
                    })
                  }
                  localStorage.setItem(storageKey, 'complete')
                  setCurrentStep('complete')
                }}
              >
                {t('initialization.skipOnboarding')}
              </Button>
            </div>
          )}
        </div>
      </Block>
      {showDeleteModal && transitionPlan && (
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
    </>
  )
}

export default TransitionPlanInitPage
