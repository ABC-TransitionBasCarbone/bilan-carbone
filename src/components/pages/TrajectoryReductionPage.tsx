'use client'

import Box from '@/components/base/Box'
import { MultiSelect } from '@/components/base/MultiSelect'
import PersistentToast from '@/components/base/PersistentToast'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import {
  TRAJECTORY_15_ID,
  TRAJECTORY_SNBC_AGRICULTURE_ID,
  TRAJECTORY_SNBC_BUILDINGS_ID,
  TRAJECTORY_SNBC_ENERGY_ID,
  TRAJECTORY_SNBC_GENERAL_ID,
  TRAJECTORY_SNBC_INDUSTRY_ID,
  TRAJECTORY_SNBC_TRANSPORTATION_ID,
  TRAJECTORY_SNBC_WASTE_ID,
  TRAJECTORY_WB2C_ID,
} from '@/constants/trajectories'
import { FullStudy } from '@/db/study'
import { TrajectoryWithObjectivesAndScope } from '@/db/transitionPlan'
import { useLocalStorageSync } from '@/hooks/useLocalStorageSync'
import { useServerFunction } from '@/hooks/useServerFunction'
import { customRich } from '@/i18n/customRich'
import { SectorPercentages } from '@/services/serverFunctions/trajectory.command'
import { deleteTransitionPlan } from '@/services/serverFunctions/transitionPlan'
import { getStudyTotalCo2Emissions } from '@/services/study'
import { convertToPastStudies } from '@/utils/trajectory'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { Tooltip, Typography } from '@mui/material'
import type { Action, ExternalStudy, SectenInfo, TransitionPlan } from '@prisma/client'
import { TrajectoryType } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Block from '../base/Block'
import SelectStudySite from '../study/site/SelectStudySite'
import MyTrajectoriesCard from '../study/trajectory/MyTrajectoriesCard'
import TrajectoryGraph from '../study/transitionPlan/TrajectoryGraph'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'
import styles from './TrajectoryReductionPage.module.css'

const TrajectoryCreationModal = dynamic(() => import('@/components/study/trajectory/TrajectoryCreationModal'))
const ConfirmDeleteModal = dynamic(() => import('@/components/modals/ConfirmDeleteModal'))

interface Props {
  study: FullStudy
  canEdit: boolean
  transitionPlan: TransitionPlan | null
  trajectories?: TrajectoryWithObjectivesAndScope[]
  linkedStudies?: FullStudy[]
  linkedExternalStudies?: ExternalStudy[]
  actions?: Action[]
  validatedOnly: boolean
  sectenData?: SectenInfo[]
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
  sectenData = [],
}: Props) => {
  const t = useTranslations('study.transitionPlan')
  const tNav = useTranslations('nav')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { callServerFunction } = useServerFunction()
  const tStudyNav = useTranslations('study.navigation')
  const [showTrajectoryModal, setShowTrajectoryModal] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [selectedCustomTrajectories, setSelectedCustomTrajectories] = useState<string[]>([])
  const [selectedSnbcTrajectories, setSelectedSnbcTrajectories] = useState<string[]>([TRAJECTORY_SNBC_GENERAL_ID])
  const [selectedSbtiTrajectories, setSelectedSbtiTrajectories] = useState<string[]>([TRAJECTORY_15_ID])
  const [mounted, setMounted] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (searchParams.get('openModal') === 'true') {
      setShowTrajectoryModal(true)
    }
  }, [searchParams])

  useEffect(() => {
    setMounted(true)
    const storedCustom = localStorage.getItem(`trajectory-custom-selected-${study.id}`)
    if (storedCustom) {
      setSelectedCustomTrajectories(JSON.parse(storedCustom))
    }

    const storedSnbc = localStorage.getItem(`trajectory-snbc-selected-${study.id}`)
    if (storedSnbc) {
      setSelectedSnbcTrajectories(JSON.parse(storedSnbc))
    }

    const storedSbti = localStorage.getItem(`trajectory-sbti-selected-${study.id}`)
    if (storedSbti) {
      setSelectedSbtiTrajectories(JSON.parse(storedSbti))
    }
  }, [study.id])

  useLocalStorageSync(`trajectory-sbti-selected-${study.id}`, selectedSbtiTrajectories, mounted)
  useLocalStorageSync(`trajectory-snbc-selected-${study.id}`, selectedSnbcTrajectories, mounted)
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

  const handleConfirmDelete = useCallback(async () => {
    await callServerFunction(() => deleteTransitionPlan(study.id), {
      onSuccess: async () => {
        setShowDeleteModal(false)
        router.refresh()
      },
    })
  }, [callServerFunction, study.id, router])

  const pastStudies = useMemo(
    () => convertToPastStudies(linkedStudies, linkedExternalStudies, true, validatedOnly, study.resultsUnit),
    [linkedStudies, linkedExternalStudies, validatedOnly, study.resultsUnit],
  )

  const studyTotalEmissions = useMemo(() => {
    return getStudyTotalCo2Emissions(study, true, validatedOnly)
  }, [study, validatedOnly])

  const defaultSnbcSectoralPercentages = useMemo(() => {
    const t = trajectories.find((t) => t.type === TrajectoryType.SNBC_SECTORAL)
    return (t?.sectorPercentages as SectorPercentages) ?? null
  }, [trajectories])

  const canCreateTrajectory = canEdit && studyTotalEmissions > 0

  if (!transitionPlan) {
    return null
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
          <TransitionPlanOnboarding
            title={t('trajectories.onboarding.title')}
            description={t('trajectories.onboarding.description')}
            storageKey="trajectory-reduction"
            detailedContent={customRich(t, 'trajectories.onboarding.detailedInfo', {
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
            <Box className={classNames('p125 flex-col justify-between gapped2', styles.trajectoryCard)}>
              <div className="flex-col gapped-2">
                <Typography variant="h5" component="h2" fontWeight={600}>
                  {t('trajectories.snbcCard.title')}
                </Typography>
                <Typography variant="body1">{t('trajectories.snbcCard.description')}</Typography>
              </div>

              <div className="w100 flex-col gapped-2">
                <MultiSelect
                  label={t('trajectories.snbcCard.methodLabel')}
                  value={selectedSnbcTrajectories}
                  onChange={setSelectedSnbcTrajectories}
                  options={[
                    { label: t('trajectories.snbcCard.general'), value: TRAJECTORY_SNBC_GENERAL_ID },
                    { label: t('trajectories.snbcCard.energy'), value: TRAJECTORY_SNBC_ENERGY_ID },
                    { label: t('trajectories.snbcCard.industry'), value: TRAJECTORY_SNBC_INDUSTRY_ID },
                    { label: t('trajectories.snbcCard.waste'), value: TRAJECTORY_SNBC_WASTE_ID },
                    { label: t('trajectories.snbcCard.buildings'), value: TRAJECTORY_SNBC_BUILDINGS_ID },
                    { label: t('trajectories.snbcCard.agriculture'), value: TRAJECTORY_SNBC_AGRICULTURE_ID },
                    { label: t('trajectories.snbcCard.transportation'), value: TRAJECTORY_SNBC_TRANSPORTATION_ID },
                  ]}
                  placeholder={t('trajectories.sbtiCard.placeholder')}
                />
              </div>
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
              <Tooltip
                title={studyTotalEmissions === 0 ? t('trajectories.graph.noEmissionSourcesDisabledButton') : ''}
                placement="top"
              >
                <Box
                  className={classNames(
                    'p125 flex-col gapped075',
                    styles.trajectoryCard,
                    canCreateTrajectory ? styles.clickableCard : styles.disabledCard,
                  )}
                  onClick={canCreateTrajectory ? () => setShowTrajectoryModal(true) : undefined}
                  role={canCreateTrajectory ? 'button' : undefined}
                  tabIndex={canCreateTrajectory ? 0 : undefined}
                >
                  <div className="flex align-center gapped-2">
                    <AddIcon color="inherit" />
                    <Typography variant="h5" component="h2" fontWeight={600}>
                      {t('trajectories.customButton')}
                    </Typography>
                  </div>
                  <Typography variant="body1">{t('trajectories.customSubtitle')}</Typography>
                </Box>
              </Tooltip>
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
            study={study}
            trajectories={trajectories}
            actions={actions}
            linkedStudies={linkedStudies}
            sectenData={sectenData}
            selectedSnbcTrajectories={selectedSnbcTrajectories}
            selectedSbtiTrajectories={selectedSbtiTrajectories}
            selectedCustomTrajectories={selectedCustomTrajectories}
            pastStudies={pastStudies}
            validatedOnly={validatedOnly}
            studyEmissions={studyTotalEmissions}
          />

          {transitionPlan && (
            <TrajectoryCreationModal
              open={showTrajectoryModal}
              onClose={() => setShowTrajectoryModal(false)}
              transitionPlanId={transitionPlan.id}
              onSuccess={handleCreateTrajectorySuccess}
              trajectory={null}
              isFirstCreation={trajectories.length <= 1} // There is one default SNBC trajectory created when saving sector percentages
              studyYear={study.startDate.getFullYear()}
              sectenData={sectenData}
              studyEmissions={studyTotalEmissions}
              pastStudies={pastStudies}
              defaultSnbcSectoralPercentages={defaultSnbcSectoralPercentages}
            />
          )}

          {showSuccessToast && (
            <PersistentToast
              title={t('trajectoryModal.success')}
              subtitle={customRich(t, 'trajectoryModal.successSubtitle', {
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
