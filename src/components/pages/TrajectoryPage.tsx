'use client'

import Button from '@/components/base/Button'
import PersistentToast from '@/components/base/PersistentToast'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { FullStudy } from '@/db/study'
import { TrajectoryWithObjectivesAndScope } from '@/db/transitionPlan'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteTransitionPlan } from '@/services/serverFunctions/transitionPlan'
import { getStudyTotalCo2Emissions } from '@/services/study'
import {
  convertToPastStudies,
  getDefaultSnbcSectoralPercentages,
  getDefaultSnbcSectoralTrajectory,
} from '@/utils/trajectory'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { Tooltip, Typography } from '@mui/material'
import type { Action, ExternalStudy, SectenInfo, TransitionPlan } from '@prisma/client'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Block from '../base/Block'
import SelectStudySite from '../study/site/SelectStudySite'
import ObjectiveFilters from '../study/trajectory/ObjectiveFilters'
import ObjectivesTable from '../study/trajectory/ObjectivesTable'
import TrajectoryGraph from '../study/transitionPlan/TrajectoryGraph'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'

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

const TrajectoryPage = ({
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')

  useEffect(() => {
    if (searchParams.get('openModal') === 'true') {
      setShowTrajectoryModal(true)
    }
  }, [searchParams])

  const handleCreateTrajectorySuccess = useCallback(() => {
    if (trajectories.length === 1) {
      setShowSuccessToast(true)
    }
    router.refresh()
  }, [router, trajectories.length])

  const handleConfirmDelete = useCallback(async () => {
    await callServerFunction(() => deleteTransitionPlan(study.id), {
      onSuccess: async () => {
        setShowDeleteModal(false)
        router.refresh()
      },
    })
  }, [callServerFunction, study.id, router])

  const pastStudies = useMemo(
    () => convertToPastStudies(linkedStudies, linkedExternalStudies, validatedOnly, study.resultsUnit),
    [linkedStudies, linkedExternalStudies, validatedOnly, study.resultsUnit],
  )

  const studyTotalEmissions = useMemo(
    () => getStudyTotalCo2Emissions(study, true, validatedOnly),
    [study, validatedOnly],
  )

  const defaultSnbcSectoralPercentages = useMemo(() => getDefaultSnbcSectoralPercentages(trajectories), [trajectories])

  const defaultSnbcSectoralTrajectoryId = useMemo(
    () => getDefaultSnbcSectoralTrajectory(trajectories)?.id ?? null,
    [trajectories],
  )

  const sites = useMemo(() => study.sites.map((s) => ({ id: s.id, name: s.site.name })), [study.sites])

  const canCreateTrajectory = canEdit && studyTotalEmissions > 0

  if (!transitionPlan) {
    return null
  }

  const addButton = canEdit && (
    <Tooltip title={studyTotalEmissions === 0 ? t('trajectories.graph.noEmissionSourcesDisabledButton') : ''}>
      <span>
        <Button startIcon={<AddIcon />} onClick={() => setShowTrajectoryModal(true)} disabled={!canCreateTrajectory}>
          {t('trajectories.addTrajectory')}
        </Button>
      </span>
    </Tooltip>
  )

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
            detailedContent={null}
          />

          <TrajectoryGraph
            study={study}
            trajectories={trajectories}
            actions={actions}
            linkedStudies={linkedStudies}
            sectenData={sectenData}
            selectedSnbcTrajectories={[]}
            selectedSbtiTrajectories={[]}
            selectedCustomTrajectories={trajectories.map((t) => t.id)}
            pastStudies={pastStudies}
            validatedOnly={validatedOnly}
            studyEmissions={studyTotalEmissions}
            titleAction={addButton}
            storageKey={`trajectory-page-${transitionPlan.id}`}
          />

          <div className="flex-col gapped1">
            <Typography variant="h5" component="h2" fontWeight={600}>
              {t('trajectories.tableTitle')}
            </Typography>
            <ObjectiveFilters search={searchFilter} setSearch={setSearchFilter} />

            <ObjectivesTable
              trajectories={trajectories}
              canEdit={canEdit}
              transitionPlanId={transitionPlan.id}
              studyId={study.id}
              studyYear={study.startDate.getFullYear()}
              searchFilter={searchFilter}
              sectenData={sectenData}
              studyEmissions={studyTotalEmissions}
              pastStudies={pastStudies}
              sites={sites}
              tagFamilies={study.tagFamilies}
              defaultSnbcSectoralTrajectoryId={defaultSnbcSectoralTrajectoryId}
            />
          </div>

          {showTrajectoryModal && (
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
            <PersistentToast title={t('trajectoryModal.success')} onClose={() => setShowSuccessToast(false)} />
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

export default TrajectoryPage
