'use client'

import Block from '@/components/base/Block'
import Box from '@/components/base/Box'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import Image from '@/components/document/Image'
import LinkedStudies from '@/components/study/transitionPlan/LinkedStudies'
import OnboardingSectionStep from '@/components/study/transitionPlan/OnboardingSectionStep'
import SectorAllocationBlock from '@/components/study/transitionPlan/SectorAllocationBlock'
import TrajectoryGraph from '@/components/study/transitionPlan/TrajectoryGraph'
import TransitionPlanFilters from '@/components/study/transitionPlan/TransitionPlanFilters'
import { storageKeys } from '@/constants/storage.constants'
import {
  SECTEN_SECTORS,
  TRAJECTORY_15_ID,
  TRAJECTORY_SNBC_GENERAL_ID,
  TRAJECTORY_WB2C_ID,
} from '@/constants/trajectory.constants'
import type { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { useTransitionPlan } from '@/hooks/useTransitionPlan'
import { useTransitionPlanFilters } from '@/hooks/useTransitionPlanFilters'
import { customRich } from '@/i18n/customRich'
import { SectorPercentages } from '@/services/serverFunctions/trajectory.command'
import { createTrajectoryWithObjectives, updateTrajectory } from '@/services/serverFunctions/trajectory.serverFunction'
import {
  deleteTransitionPlan,
  initializeTransitionPlan,
  updateTransitionPlanSectenVersion,
} from '@/services/serverFunctions/transitionPlan'
import { TrajectoryWithObjectivesAndScope } from '@/types/trajectory.types'
import { compareSectenVersions } from '@/utils/secten'
import { calculateSectoralSNBCReductionRates, getDefaultSnbcSectoralTrajectory } from '@/utils/snbc'
import { getInitialCurrentStep, readStoredStringArray } from '@/utils/transitionPlan.utils'
import DeleteIcon from '@mui/icons-material/Delete'
import type { ExternalStudy, SectenInfo, SectenVersion, TransitionPlan } from '@repo/db-common'
import { TrajectoryType } from '@repo/db-common/enums'
import { Button } from '@repo/ui'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ReferenceTrajectorySelectionSection } from '../study/transitionPlan/ReferenceTrajectorySelectionSection'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'
import styles from './TransitionPlanInitPage.module.css'

const TransitionPlanSelectionModal = dynamic(
  () => import('@/components/study/transitionPlan/TransitionPlanSelectionModal'),
)
const ConfirmDeleteModal = dynamic(() => import('@/components/modals/ConfirmDeleteModal'))
const SectenUpdateModal = dynamic(() => import('@/components/study/transitionPlan/SectenUpdateModal'))

const TOTAL_STEPS = 4
const SBTI_TRAJECTORY_IDS = [TRAJECTORY_15_ID, TRAJECTORY_WB2C_ID] as const

interface Props {
  study: FullStudy
  canEdit: boolean
  transitionPlan: TransitionPlan | null
  trajectories: TrajectoryWithObjectivesAndScope[]
  linkedStudies: FullStudy[]
  linkedExternalStudies: ExternalStudy[]
  validatedOnly: boolean
  sectenData: SectenInfo[]
  latestSectenVersion: (SectenVersion & { sectenInfos: SectenInfo[] }) | null
  isSectenOutdated: boolean
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
  latestSectenVersion,
  isSectenOutdated,
}: Props) => {
  const t = useTranslations('study.transitionPlan')
  const tDocumentation = useTranslations('documentationUrl')
  const tBlock = useTranslations('study.transitionPlan.initialization.sectorBlock')
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSectenUpdateModal, setShowSectenUpdateModal] = useState(false)
  const [isSectenUpdateLoading, setIsSectenUpdateLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<number | 'complete'>(() =>
    getInitialCurrentStep(`transition-init-step-${study.id}`, trajectories.length),
  )
  const [selectedSnbcTrajectories, setSelectedSnbcTrajectories] = useState<string[]>(
    () => readStoredStringArray(`trajectory-snbc-selected-${study.id}`) ?? [TRAJECTORY_SNBC_GENERAL_ID],
  )
  const [selectedSbtiTrajectories, setSelectedSbtiTrajectories] = useState<string[]>(
    () => readStoredStringArray(`trajectory-sbti-selected-${study.id}`) ?? [TRAJECTORY_15_ID],
  )
  const {
    selectedSiteIds,
    selectedSubPosts,
    selectedTagIds,
    filtersMounted,
    setSelectedSiteIds,
    setSelectedSubPosts,
    setSelectedTagIds,
  } = useTransitionPlanFilters(study.id)

  const storageKey = `transition-init-step-${study.id}`
  const snbcStorageKey = `trajectory-snbc-selected-${study.id}`
  const sbtiStorageKey = `trajectory-sbti-selected-${study.id}`
  const isComplete = currentStep === 'complete'
  const defaultSnbcSectoralTrajectory = useMemo(() => getDefaultSnbcSectoralTrajectory(trajectories), [trajectories])
  const validSnbcIds = useMemo(
    () =>
      new Set([
        TRAJECTORY_SNBC_GENERAL_ID,
        ...SECTEN_SECTORS,
        ...(defaultSnbcSectoralTrajectory ? [defaultSnbcSectoralTrajectory.id] : []),
      ]),
    [defaultSnbcSectoralTrajectory],
  )
  const sanitizedSelectedSnbcTrajectories = useMemo(
    () => selectedSnbcTrajectories.filter((id) => id !== 'sectoral' && validSnbcIds.has(id)),
    [selectedSnbcTrajectories, validSnbcIds],
  )
  const sanitizedSelectedSbtiTrajectories = useMemo(
    () =>
      selectedSbtiTrajectories.filter((id) => SBTI_TRAJECTORY_IDS.includes(id as (typeof SBTI_TRAJECTORY_IDS)[number])),
    [selectedSbtiTrajectories],
  )

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
    localStorage.setItem(snbcStorageKey, JSON.stringify(sanitizedSelectedSnbcTrajectories))
  }, [snbcStorageKey, sanitizedSelectedSnbcTrajectories])

  useEffect(() => {
    localStorage.setItem(sbtiStorageKey, JSON.stringify(sanitizedSelectedSbtiTrajectories))
  }, [sbtiStorageKey, sanitizedSelectedSbtiTrajectories])

  useEffect(() => {
    if (transitionPlan) {
      return
    }

    // If there is no transition plan, clear stale localStorage related to transition-plan setup.
    const keysToRemove = [
      storageKey,
      snbcStorageKey,
      sbtiStorageKey,
      storageKeys.studyFilterSites(study.id),
      storageKeys.studyFilterSubposts(study.id),
      storageKeys.studyFilterTags(study.id),
      'onboarding-transition-plan-initialization',
    ]
    keysToRemove.forEach((key) => localStorage.removeItem(key))

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith('transition-plan-init-')) {
        localStorage.removeItem(key)
        localStorage.removeItem(`${key}-yearRange`)
      }
    }
  }, [transitionPlan, storageKey, snbcStorageKey, sbtiStorageKey, study.id])

  const handleSnbcTrajectoriesChange = useCallback(
    (next: string[]) => {
      setSelectedSnbcTrajectories(next.filter((id) => validSnbcIds.has(id)))
    },
    [validSnbcIds],
  )
  const handleSbtiTrajectoriesChange = useCallback((next: string[]) => {
    setSelectedSbtiTrajectories(
      next.filter((id) => SBTI_TRAJECTORY_IDS.includes(id as (typeof SBTI_TRAJECTORY_IDS)[number])),
    )
  }, [])

  const { pastStudies, studyTotalEmissions, filteredStudyEmissions, filteredPastStudies } = useTransitionPlan({
    study,
    linkedStudies,
    linkedExternalStudies,
    validatedOnly,
    selectedSiteIds,
    selectedSubPosts,
    selectedTagIds,
  })

  const handleConfirmDelete = useCallback(async () => {
    await callServerFunction(() => deleteTransitionPlan(study.id), {
      onSuccess: async () => {
        setShowDeleteModal(false)
        router.refresh()
      },
    })
  }, [callServerFunction, study.id, router])

  const handleOpenSectenUpdateModal = useCallback(() => {
    if (!latestSectenVersion) {
      return
    }
    setShowSectenUpdateModal(true)
  }, [latestSectenVersion])

  const handleConfirmSectenUpdate = useCallback(async () => {
    if (!transitionPlan || !latestSectenVersion) {
      return
    }
    setIsSectenUpdateLoading(true)
    await callServerFunction(() => updateTransitionPlanSectenVersion(transitionPlan.id, latestSectenVersion.id), {
      onSuccess: () => {
        setShowSectenUpdateModal(false)
        router.refresh()
      },
    })
    setIsSectenUpdateLoading(false)
  }, [transitionPlan, latestSectenVersion, callServerFunction, router])

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
            description={customRich(t, 'initialization.onboarding.description')}
            storageKey="transition-plan-initialization"
            detailedContent={customRich(t, 'initialization.onboarding.detailedInfo', {
              link1: (children) => (
                <Link href={tDocumentation('SNBC')} target="_blank" rel="noreferrer noopener">
                  {children}
                </Link>
              ),
              link2: (children) => (
                <Link href={tDocumentation('SBTi')} target="_blank" rel="noreferrer noopener">
                  {children}
                </Link>
              ),
              link3: (children) => (
                <Link href={tDocumentation('carbon budget')} target="_blank" rel="noreferrer noopener">
                  {children}
                </Link>
              ),
              link4: (children) => (
                <Link href={tDocumentation('carbon neutrality')} target="_blank" rel="noreferrer noopener">
                  {children}
                </Link>
              ),
            })}
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
            description={customRich(t, 'initialization.stepSelectReferenceTrajectories.description')}
            glossaryLabel="init-step-select-reference-trajectories"
            glossaryTitleKey="glossaryTitle"
            tModal="study.transitionPlan.initialization.stepSelectReferenceTrajectories"
            isVisible={isStepVisible(2)}
            isActive={isStepActive(2)}
            onClickNext={() => validateStep(2)}
            showNextButton={isStepActive(2)}
          >
            <ReferenceTrajectorySelectionSection
              selectedSnbcTrajectories={sanitizedSelectedSnbcTrajectories}
              setSelectedSnbcTrajectories={handleSnbcTrajectoriesChange}
              selectedSbtiTrajectories={sanitizedSelectedSbtiTrajectories}
              setSelectedSbtiTrajectories={handleSbtiTrajectoriesChange}
              customSnbcSectoralTrajectory={defaultSnbcSectoralTrajectory}
              isSectenOutdated={isSectenOutdated}
              canEdit={canEdit}
              onOpenSectenUpdateModal={handleOpenSectenUpdateModal}
            />
          </OnboardingSectionStep>

          {/* Step 4 – Reference graph */}
          <OnboardingSectionStep
            title={t('initialization.stepVisualization.title')}
            description={customRich(t, 'initialization.stepVisualization.description')}
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
              selectedSubPosts={selectedSubPosts}
              selectedTagIds={selectedTagIds}
              onSiteFilterChange={setSelectedSiteIds}
              onSubPostFilterChange={setSelectedSubPosts}
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
              selectedSnbcTrajectories={sanitizedSelectedSnbcTrajectories.filter(
                (id) => id !== defaultSnbcSectoralTrajectory?.id,
              )}
              selectedSbtiTrajectories={sanitizedSelectedSbtiTrajectories}
              selectedCustomTrajectories={
                defaultSnbcSectoralTrajectory &&
                sanitizedSelectedSnbcTrajectories.includes(defaultSnbcSectoralTrajectory.id)
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
          message={customRich(t, 'trajectories.delete.description')}
          confirmText={t('trajectories.delete.confirm')}
          cancelText={t('trajectories.delete.cancel')}
          requireNameMatch={study.name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
      {showSectenUpdateModal && (
        <SectenUpdateModal
          open={showSectenUpdateModal}
          onClose={() => setShowSectenUpdateModal(false)}
          onConfirm={handleConfirmSectenUpdate}
          diff={compareSectenVersions(sectenData, latestSectenVersion?.sectenInfos ?? [])}
          isLoading={isSectenUpdateLoading}
        />
      )}
    </>
  )
}

export default TransitionPlanInitPage
