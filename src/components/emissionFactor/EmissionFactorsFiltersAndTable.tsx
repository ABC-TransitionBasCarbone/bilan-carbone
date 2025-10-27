'use client'

import { EmissionFactorList } from '@/db/emissionFactors'
import { environmentSubPostsMapping, Post, subPostsByPost } from '@/services/posts'
import { EmissionFactorWithMetaData, getEmissionFactors } from '@/services/serverFunctions/emissionFactor'
import { BCUnit } from '@/services/unit'
import { Environment, SubPost } from '@prisma/client'
import { PaginationState } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  const envSubPosts = useMemo(() => {
    return posts.reduce((acc, post) => {
      const subPosts = subPostsByPost[post as Post] || []
      return acc.concat(subPosts)
    }, [] as SubPost[])
  }, [posts])

  const [filters, setFilters] = useState({
    archived: false,
    search: '',
    location: '',
    sources: initialImportVersions,
    units: initialSelectedUnits,
    subPosts: defaultSubPost ? [defaultSubPost] : envSubPosts,
  })
  const filtersRef = useRef(filters)

  const fromModal = !!selectEmissionFactor

  useEffect(() => {
    async function fetchEmissionFactors() {
      const takeValue = skip === 0 ? pagination.pageSize * 4 : pagination.pageSize
      filtersRef.current = filters
      const emissionFactorsFromBdd = await getEmissionFactors(skip, takeValue, filters, studyId)

      if (filtersRef.current !== filters) {
        setSkip((prevSkip) => takeValue + prevSkip)

        if (emissionFactorsFromBdd.success) {
          setEmissionFactors((prevEF) => prevEF.concat(emissionFactorsFromBdd.data.emissionFactors))
          setTotalCount(emissionFactorsFromBdd.data.count)
        } else {
          setTotalCount(0)
          setEmissionFactors([])
        }
      }
    }

    const alreadyLoadedCount = skip + pagination.pageSize
    const alreadyDisplayedCount = (pagination.pageIndex + 1) * pagination.pageSize
    const pagesInAdvancedToLoad = 3

    if (
      alreadyLoadedCount < alreadyDisplayedCount + pagination.pageSize * pagesInAdvancedToLoad &&
      alreadyLoadedCount < totalCount
    ) {
      console.log('in loading FE', alreadyDisplayedCount, alreadyLoadedCount, pagesInAdvancedToLoad, totalCount)
      fetchEmissionFactors()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emissionFactors.length, pagination.pageIndex])

  useEffect(() => {
    async function fetchEmissionFactors() {
      setEmissionFactors([])
      setTotalCount(0)

      const emissionFactorsFromBdd = await getEmissionFactors(0, 100, filters, studyId)
      setSkip(100)

      if (emissionFactorsFromBdd.success) {
        setPagination((prevPagination) => ({ ...prevPagination, pageIndex: 0 }))
        setEmissionFactors(emissionFactorsFromBdd.data.emissionFactors)
        setTotalCount(emissionFactorsFromBdd.data.count)
      }
    }

    fetchEmissionFactors()
  }, [filters, studyId])

  return (
    <>
      {t('subTitle')}
      <EmissionFactorsFilters
        fromModal={fromModal}
        importVersions={importVersions}
        initialSelectedUnits={initialSelectedUnits}
        envPosts={posts}
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
