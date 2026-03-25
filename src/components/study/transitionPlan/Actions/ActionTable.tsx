'use client'

import BaseTable from '@/components/base/Table'
import styles from '@/components/base/Table.module.css'
import { TableActionButton } from '@/components/base/TableActionButton'
import GlossaryIconModal from '@/components/modals/GlossaryIconModal'
import commonStyles from '@/components/study/results/commonTable.module.css'
import { useServerFunction } from '@/hooks/useServerFunction'
import { customRich } from '@/i18n/customRich'
import { environmentSubPostsMapping } from '@/services/posts'
import { toggleActionEnabled } from '@/services/serverFunctions/transitionPlan'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import type { ActionWithRelations } from '@/types/trajectory.types'
import { formatNumber } from '@/utils/number'
import { convertValue } from '@/utils/study'
import { getYearFromDateStr } from '@/utils/time'
import ArrowRight from '@mui/icons-material/ArrowRight'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Link, Switch, TableCell, TableRow } from '@mui/material'
import { ActionPotentialDeduction, StudyResultUnit } from '@prisma/client'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  PaginationState,
  Row,
  useReactTable,
} from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'

interface Props {
  actions: ActionWithRelations[]
  openEditModal: (action: ActionWithRelations) => void
  openDeleteModal: (action: ActionWithRelations) => void
  canEdit: boolean
  studyId: string
  studyUnit: StudyResultUnit
  allSites: Array<{ id: string; name: string }>
}

const ActionTable = ({ actions, openEditModal, openDeleteModal, canEdit, studyId, studyUnit, allSites }: Props) => {
  const { environment } = useAppEnvironmentStore()
  const tActiontable = useTranslations('study.transitionPlan.actions.table')
  const tCommon = useTranslations('common')
  const tAction = useTranslations('study.transitionPlan.actions')
  const tUnit = useTranslations('study.results.units')
  const tCategory = useTranslations('study.transitionPlan.actions.category')
  const tPotential = useTranslations('study.transitionPlan.actions.potentialDeduction')
  const tPosts = useTranslations('emissionFactors.post')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const router = useRouter()
  const { callServerFunction } = useServerFunction()

  const [localActions, setLocalActions] = useState<ActionWithRelations[]>(actions)

  useEffect(() => {
    setLocalActions(actions)
  }, [actions])

  const handleToggleEnabled = useCallback(
    async (actionId: string, enabled: boolean) => {
      setLocalActions((prev) => prev.map((action) => (action.id === actionId ? { ...action, enabled } : action)))

      await callServerFunction(() => toggleActionEnabled(actionId, enabled), {
        onSuccess: () => {
          router.refresh()
        },
        onError: () => {
          setLocalActions(actions)
        },
      })
    },
    [callServerFunction, router, setLocalActions, actions],
  )

  const getPotential = useCallback(
    (action: ActionWithRelations) => {
      switch (action.potentialDeduction) {
        case ActionPotentialDeduction.Quality:
          return tPotential(ActionPotentialDeduction.Quality)
        case ActionPotentialDeduction.Quantity:
          if (action.reductionValueKg !== null) {
            const valueInStudyUnit = convertValue(action.reductionValueKg, StudyResultUnit.K, studyUnit)
            return `${formatNumber(valueInStudyUnit)} ${tUnit(studyUnit)}`
          }
          return ''
        default:
          return ''
      }
    },
    [tPotential, tUnit, studyUnit],
  )

  const getImplementationPeriod = useCallback((action: ActionWithRelations) => {
    if (!action.reductionStartYear || !action.reductionEndYear) {
      return ''
    }
    const startYear = getYearFromDateStr(action.reductionStartYear)
    const endYear = getYearFromDateStr(action.reductionEndYear)
    return `${startYear}-${endYear}`
  }, [])

  const getScopeItemDisplay = useCallback(
    <T,>(
      items: T[],
      allKey: Parameters<typeof tCommon>[0],
      countKey: Parameters<typeof tCommon>[0],
      getName: (item: T) => string,
      isCompact: boolean = false,
    ) => {
      if (items.length === 0) {
        return tCommon(allKey)
      }
      if (isCompact && items.length > 1) {
        return tCommon(countKey, { count: items.length })
      }
      return items.map(getName).join(', ')
    },
    [tCommon],
  )

  const getSitesDisplay = useCallback(
    (action: ActionWithRelations, isCompact: boolean = false) =>
      getScopeItemDisplay(
        action.sites,
        'allSites',
        'xSites',
        (site) => allSites.find((s) => s.id === site.studySiteId)?.name ?? site.studySiteId,
        isCompact,
      ),
    [allSites, getScopeItemDisplay],
  )

  const getSitesCompactDisplay = useCallback(
    (action: ActionWithRelations) => {
      const { sites } = action
      const sitesEmpty = sites.length === 0

      return sitesEmpty ? tCommon('all') : getSitesDisplay(action, true)
    },
    [getSitesDisplay, tCommon],
  )

  const getSubPostsDisplay = useCallback(
    (action: ActionWithRelations, isCompact: boolean = false) =>
      getScopeItemDisplay(action.subPosts, 'allPosts', 'xSubPosts', (subPost) => tPosts(subPost.subPost), isCompact),
    [tPosts, getScopeItemDisplay],
  )

  const getSubPostsCompactDisplay = useCallback(
    (action: ActionWithRelations) => {
      const { subPosts } = action

      let displaySubPosts = [...subPosts]
      const displayPosts = []

      if (environment) {
        const mapping = environmentSubPostsMapping[environment]
        const subPostSet = new Set(displaySubPosts.map((sp) => sp.subPost))

        for (const [post, mappedSubPosts] of Object.entries(mapping)) {
          const allPresent = mappedSubPosts.every((sp) => subPostSet.has(sp))

          if (allPresent) {
            mappedSubPosts.forEach((sp) => subPostSet.delete(sp))
            displayPosts.push(post)
          }
        }

        displaySubPosts = displaySubPosts.filter((sp) => subPostSet.has(sp.subPost))
      }
      const subPostsEmpty = displaySubPosts.length === 0

      let display = ''
      if (displayPosts.length === 0 && subPostsEmpty) {
        display = tCommon('allPosts')
      } else if (displayPosts.length > 0) {
        display = getScopeItemDisplay(displayPosts, 'allPosts', 'xSubPosts', (post) => tPosts(post))
        if (!subPostsEmpty) {
          display += ` ${tCommon('and')} `
        }
      }

      if (!subPostsEmpty) {
        display += getSubPostsDisplay({ subPosts: displaySubPosts } as ActionWithRelations, true)
      }

      return display
    },
    [environment, getSubPostsDisplay, tCommon],
  )

  const getTagsDisplay = useCallback(
    (action: ActionWithRelations, isCompact: boolean = false) =>
      getScopeItemDisplay(action.tags, 'allTags', 'xTags', (tag) => tag.studyTag.name, isCompact),
    [getScopeItemDisplay],
  )

  const getTagsCompactDisplay = useCallback(
    (action: ActionWithRelations) => {
      const { tags } = action
      const tagsEmpty = tags.length === 0

      return tagsEmpty ? tCommon('allTags') : getTagsDisplay(action, true)
    },
    [getTagsDisplay, tCommon],
  )

  const columns = useMemo(
    () =>
      [
        {
          id: 'expand',
          header: '',
          accessorFn: () => '',
          cell: ({ row }) => (
            <button
              onClick={row.getToggleExpandedHandler()}
              className={classNames('align-center', commonStyles.expandable)}
            >
              {row.getIsExpanded() ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
            </button>
          ),
        },
        {
          id: 'enabled',
          header: () => (
            <div className="flex-cc">
              <GlossaryIconModal
                title="enabledGlossaryTitle"
                iconLabel="enabledGlossaryIconLabel"
                label="enabled"
                tModal="study.transitionPlan.actions.table"
              >
                <p>
                  {customRich(tActiontable, 'enabledGlossaryDescription', {
                    trajectoryLink: (children) => (
                      <Link href={`/etudes/${studyId}/trajectoires`} target="_blank" rel="noreferrer noopener">
                        {children}
                      </Link>
                    ),
                  })}
                </p>
              </GlossaryIconModal>
            </div>
          ),
          accessorKey: 'enabled',
          cell: ({ getValue, row }) => (
            <div className="flex-cc">
              <Switch
                checked={getValue<boolean>()}
                onChange={(event) => handleToggleEnabled(row.original.id, event.target.checked)}
                color="primary"
                size="small"
                disabled={!canEdit}
              />
            </div>
          ),
        },
        {
          header: tActiontable('title'),
          accessorKey: 'title',
        },
        {
          header: tActiontable('sites'),
          accessorFn: getSitesCompactDisplay,
        },
        {
          header: tActiontable('posts'),
          accessorFn: getSubPostsCompactDisplay,
        },
        {
          header: tActiontable('tags'),
          accessorFn: getTagsCompactDisplay,
        },
        {
          header: tActiontable('priority'),
          accessorKey: 'priority',
        },
        {
          header: tActiontable('actionType'),
          accessorFn: (action) => action.category.map((category) => tCategory(category)).join(', '),
        },
        {
          header: tActiontable('implementation'),
          accessorFn: getImplementationPeriod,
        },
        { header: tActiontable('potential'), accessorFn: getPotential },
        { header: tActiontable('owner'), accessorKey: 'owner' },
        { header: `${tActiontable('budget')} (k€)`, accessorKey: 'necessaryBudget' },
        {
          id: 'actions',
          header: '',
          accessorFn: () => '',
          cell: ({ row }) =>
            canEdit ? (
              <>
                <TableActionButton type="edit" onClick={() => openEditModal(row.original)} />
                <TableActionButton type="delete" onClick={() => openDeleteModal(row.original)} />
              </>
            ) : (
              <></>
            ),
        },
      ] as ColumnDef<ActionWithRelations>[],
    [
      tActiontable,
      getImplementationPeriod,
      getPotential,
      studyId,
      getSitesCompactDisplay,
      getSubPostsCompactDisplay,
      getTagsCompactDisplay,
      canEdit,
      handleToggleEnabled,
      tCategory,
      openEditModal,
      openDeleteModal,
    ],
  )

  const table = useReactTable({
    columns,
    data: localActions,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getRowCanExpand: () => true,
    getExpandedRowModel: getExpandedRowModel(),
    state: { pagination },
  })

  const Row = (row: Row<ActionWithRelations>) => (
    <Fragment key={row.id}>
      <TableRow key={`${row.id}-main`} className={styles.line} data-testid="actions-table-row">
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
        ))}
      </TableRow>

      {row.getIsExpanded() && (
        <TableRow key={`${row.id}-expanded`}>
          <TableCell colSpan={row.getVisibleCells().length}>
            <p className="italic mb1">{row.original.detailedDescription}</p>
            <p className="bold">{tAction('addModal.subSteps')} :</p>
            <p className="mb1 flex">
              {row.original.steps.map((step, index) => (
                <div key={step.id} className="flex align-center">
                  <span>{step.title}</span>
                  {index < row.original.steps.length - 1 && <ArrowRight />}
                </div>
              ))}
            </p>
            {!!row.original.nature.length && (
              <p className="mb1">
                <span className="bold">{tAction('addModal.nature')} : </span>
                {row.original.nature.map((n) => tAction(`nature.${n}`)).join(', ')}
              </p>
            )}
            {!!row.original.category.length && (
              <p className="mb1">
                <span className="bold">{tAction('addModal.category')} : </span>
                {row.original.category.map((c) => tAction(`category.${c}`)).join(', ')}
              </p>
            )}
            {!!row.original.relevance.length && (
              <p className="mb1">
                <span className="bold">{tActiontable('relevance')} : </span>
                {row.original.relevance.map((r) => tAction(`relevance.${r}`)).join(', ')}
              </p>
            )}
            <div>
              <span className="bold">{tActiontable('scope')} :</span>
              {!row.original.sites.length && !row.original.subPosts.length && !row.original.tags.length ? (
                <p className="ml1">{tCommon('all')}</p>
              ) : (
                <>
                  <p className="ml1">
                    <span className="bold">{tCommon('sites')} : </span>
                    {getSitesDisplay(row.original)}
                  </p>

                  <p className="ml1">
                    <span className="bold">{tCommon('subPosts')} : </span>
                    {getSubPostsDisplay(row.original)}
                  </p>

                  <p className="ml1">
                    <span className="bold">{tCommon('tags')} : </span>
                    {getTagsDisplay(row.original)}
                  </p>
                </>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  )

  return <BaseTable customRow={Row} table={table} paginations={[10, 25, 50, 100]} testId="actions" />
}

export default ActionTable
