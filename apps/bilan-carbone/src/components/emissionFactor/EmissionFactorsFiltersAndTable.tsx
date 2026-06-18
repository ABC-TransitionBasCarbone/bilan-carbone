'use client'

import { EmissionFactorList } from '@/db/emissionFactors'
import { environmentSubPostsMapping, Post, subPostsByPost } from '@/services/posts'
import { EmissionFactorWithMetaData, getEmissionFactors } from '@/services/serverFunctions/emissionFactor'
import { getStudyExports } from '@/services/serverFunctions/study'
import { BCUnit } from '@/services/unit'
import { FeFilters } from '@/types/filters'
import { convertFiltersToSearchParams, convertSearchParamsToFilters } from '@/utils/emissionFactorFIlters.utils'
import { EmissionFactorBase, Environment, Export, SubPost } from '@abc-transitionbascarbone/db-common/enums'
import { PaginationState } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import EditEmissionFactorModal from './edit/EditEmissionFactorModal'
import { EmissionFactorsFilters, ImportVersionForFilters } from './EmissionFactorsFilters'
import { EmissionFactorsTable } from './EmissionFactorsTable'

interface Props {
  userOrganizationId?: string | null
  environment: Environment
  initialImportVersions: string[]
  importVersions: ImportVersionForFilters[]
  locationOptions: string[]
  defaultSubPost?: SubPost
  studyId?: string
  hasActiveLicence: boolean
  selectEmissionFactor?: (emissionFactor: EmissionFactorWithMetaData) => void
}

const initialSelectedUnits: BCUnit[] = Object.values(BCUnit)
const allEmissionFactorBases = Object.values(EmissionFactorBase)

const EmissionFactorsFiltersAndTable = ({
  userOrganizationId,
  environment,
  initialImportVersions,
  importVersions,
  locationOptions,
  defaultSubPost,
  studyId,
  hasActiveLicence,
  selectEmissionFactor,
}: Props) => {
  const t = useTranslations('emissionFactors.table')
  const router = useRouter()
  const searchParams = useSearchParams()

  const [action, setAction] = useState<'edit' | 'delete' | undefined>(undefined)
  const [targetedEmission, setTargetedEmission] = useState('')
  const [refreshKey, setRefreshKey] = useState(Date.now())
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactorList[]>([])
  const [hasGHGPExport, setHasGHGPExport] = useState(false)
  const [skip, setSkip] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  const envSubPostsByPost = useMemo(() => environmentSubPostsMapping[environment], [environment])
  const posts = useMemo(() => Object.keys(envSubPostsByPost) as Post[], [envSubPostsByPost])
  const envSubPosts = useMemo(
    () => posts.reduce((acc, post) => acc.concat(subPostsByPost[post] || []), [] as SubPost[]),
    [posts],
  )

  const [filters, setFilters] = useState<FeFilters>(() => {
    const initialFilters = selectEmissionFactor
      ? {
          archived: false,
          search: '',
          locations: [],
          sources: initialImportVersions,
          units: [],
          subPosts: defaultSubPost ? [defaultSubPost] : (['all'] as FeFilters['subPosts']),
        }
      : convertSearchParamsToFilters(searchParams, initialImportVersions.length > 0 ? initialImportVersions : [])
    return {
      ...initialFilters,
      subPosts: defaultSubPost ? [defaultSubPost] : initialFilters.subPosts,
    }
  })

  const resolvedSubPosts = useMemo(
    () =>
      filters.subPosts.length === 1 && filters.subPosts[0] === 'all' ? envSubPosts : (filters.subPosts as SubPost[]),
    [filters.subPosts, envSubPosts],
  )

  const shouldShowBase =
    hasGHGPExport && (defaultSubPost?.includes(SubPost.Electricite) || resolvedSubPosts.includes(SubPost.Electricite))

  const resolvedFilters = useMemo(
    () => ({
      ...filters,
      subPosts: resolvedSubPosts,
      base: shouldShowBase ? allEmissionFactorBases : undefined,
    }),
    [filters, resolvedSubPosts, shouldShowBase],
  )

  const urlRefreshKey = searchParams.get('refreshKey')

  useEffect(() => {
    if (!selectEmissionFactor) {
      const params = convertFiltersToSearchParams(filters)
      if (urlRefreshKey) {
        params.set('refreshKey', urlRefreshKey)
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }, [filters, router, selectEmissionFactor, urlRefreshKey])

  const fromModal = !!selectEmissionFactor

  useEffect(() => {
    async function fetchEmissionFactors() {
      const takeValue = skip === 0 ? pagination.pageSize * 4 : pagination.pageSize
      const emissionFactorsFromBdd = await getEmissionFactors(skip, takeValue, resolvedFilters, environment, studyId)

      setSkip((prevSkip) => takeValue + prevSkip)

      if (emissionFactorsFromBdd.success) {
        setEmissionFactors((prevEF) => prevEF.concat(emissionFactorsFromBdd.data.emissionFactors))
        setTotalCount(emissionFactorsFromBdd.data.count)
      } else {
        setTotalCount(0)
        setEmissionFactors([])
      }
    }

    const alreadyLoadedCount = skip
    const alreadyDisplayedCount = (pagination.pageIndex + 1) * pagination.pageSize
    const pagesInAdvanceToLoad = 3

    if (
      alreadyLoadedCount < alreadyDisplayedCount + pagination.pageSize * pagesInAdvanceToLoad &&
      alreadyLoadedCount < totalCount
    ) {
      fetchEmissionFactors()
    }
  }, [pagination.pageIndex, pagination.pageSize, skip, totalCount, resolvedFilters, environment, studyId])

  useEffect(() => {
    const fetchEmissionFactors = async () => {
      setEmissionFactors([])
      setTotalCount(0)
      const takeValue = pagination.pageSize * 4

      const emissionFactorsFromBdd = await getEmissionFactors(0, takeValue, resolvedFilters, environment, studyId)

      if (emissionFactorsFromBdd.success) {
        setSkip(takeValue)
        setPagination((prevPagination) => ({ ...prevPagination, pageIndex: 0 }))
        setEmissionFactors(emissionFactorsFromBdd.data.emissionFactors)
        setTotalCount(emissionFactorsFromBdd.data.count)
      }
    }

    fetchEmissionFactors()
  }, [resolvedFilters, environment, studyId, pagination.pageSize, refreshKey, urlRefreshKey])

  useEffect(() => {
    const fetchStudyExports = async () => {
      const studyExports = await getStudyExports(studyId)
      if (studyExports.success) {
        setHasGHGPExport(studyExports.data.includes(Export.GHGP))
      }
    }
    fetchStudyExports()
  }, [studyId])

  return (
    <>
      {!fromModal && t('subTitle')}
      <EmissionFactorsFilters
        fromModal={fromModal}
        importVersions={importVersions}
        initialSelectedUnits={initialSelectedUnits}
        envPosts={posts}
        envSubPosts={envSubPosts}
        filters={filters}
        resolvedSubPosts={resolvedSubPosts}
        setFilters={setFilters}
        locationOptions={locationOptions}
      />
      <EmissionFactorsTable
        setTargetedEmission={setTargetedEmission}
        setAction={setAction}
        data={emissionFactors}
        userOrganizationId={userOrganizationId}
        environment={environment}
        totalCount={totalCount}
        pagination={pagination}
        setPagination={setPagination}
        selectEmissionFactor={selectEmissionFactor}
        hasActiveLicence={hasActiveLicence}
        hasGHGPExport={hasGHGPExport}
      />
      <EditEmissionFactorModal
        emissionFactorId={targetedEmission}
        action={action}
        setAction={setAction}
        onDelete={() => setRefreshKey(Date.now())}
      />
    </>
  )
}

export default EmissionFactorsFiltersAndTable
