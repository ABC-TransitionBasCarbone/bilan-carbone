'use client'

import { EmissionFactorList } from '@/db/emissionFactors'
import { environmentSubPostsMapping, Post, subPostsByPost } from '@/services/posts'
import { EmissionFactorWithMetaData, getEmissionFactors } from '@/services/serverFunctions/emissionFactor'
import { BCUnit } from '@/services/unit'
import { FeFilters } from '@/types/filters'
import { Environment, SubPost } from '@prisma/client'
import { PaginationState } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
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

const initialSelectedUnits: (BCUnit | string)[] = [...['all'], ...Object.values(BCUnit)]
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
  const [action, setAction] = useState<'edit' | 'delete' | undefined>(undefined)
  const [targetedEmission, setTargetedEmission] = useState('')
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactorList[]>([])
  const [skip, setSkip] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  const envSubPostsByPost = useMemo(() => environmentSubPostsMapping[environment], [environment])
  const posts = useMemo(() => Object.keys(envSubPostsByPost) as Post[], [envSubPostsByPost])
  const envSubPosts = useMemo(
    () => posts.reduce((acc, post) => acc.concat(subPostsByPost[post] || []), [] as SubPost[]),
    [posts],
  )

  const [filters, setFilters] = useState<FeFilters>({
    archived: false,
    search: '',
    location: '',
    sources: initialImportVersions,
    units: initialSelectedUnits,
    subPosts: defaultSubPost ? [defaultSubPost] : ['all'],
  })

  useEffect(() => {
    if (filters.subPosts.length === 1 && filters.subPosts[0] === 'all') {
      setFilters((prevFilters) => ({ ...prevFilters, subPosts: envSubPosts }))
    }
  }, [filters.subPosts, envSubPosts])

  const fromModal = !!selectEmissionFactor

  useEffect(() => {
    async function fetchEmissionFactors() {
      const takeValue = skip === 0 ? pagination.pageSize * 4 : pagination.pageSize
      const emissionFactorsFromBdd = await getEmissionFactors(skip, takeValue, filters, environment, studyId)

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
    const pagesInAdvancedToLoad = 3

    if (
      alreadyLoadedCount < alreadyDisplayedCount + pagination.pageSize * pagesInAdvancedToLoad &&
      alreadyLoadedCount < totalCount
    ) {
      fetchEmissionFactors()
    }
    // We only want to trigger this effect when the user change pages or the number of FE per page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize])

  useEffect(() => {
    const fetchEmissionFactors = async () => {
      setEmissionFactors([])
      setTotalCount(0)
      const takeValue = pagination.pageSize * 4

      const emissionFactorsFromBdd = await getEmissionFactors(0, takeValue, filters, environment, studyId)
      setSkip(takeValue)

      if (emissionFactorsFromBdd.success) {
        setPagination((prevPagination) => ({ ...prevPagination, pageIndex: 0 }))
        setEmissionFactors(emissionFactorsFromBdd.data.emissionFactors)
        setTotalCount(emissionFactorsFromBdd.data.count)
      }
    }

    fetchEmissionFactors()
    // We don't want this effect to trigger when number of FE changes, because it is the use case of the other effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.archived, filters.search, filters.location, filters.sources, filters.units, filters.subPosts, studyId])

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
      />
      <EditEmissionFactorModal
        emissionFactorId={targetedEmission}
        action={action}
        setAction={setAction}
        setFilters={setFilters}
      />
    </>
  )
}

export default EmissionFactorsFiltersAndTable
