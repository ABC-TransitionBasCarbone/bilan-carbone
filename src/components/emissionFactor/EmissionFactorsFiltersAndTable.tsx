'use client'

import { EmissionFactorList } from '@/db/emissionFactors'
import { environmentSubPostsMapping, Post, subPostsByPost } from '@/services/posts'
import {
  EmissionFactorWithMetaData,
  getEmissionFactors,
  getImportVersions,
} from '@/services/serverFunctions/emissionFactor'
import { BCUnit } from '@/services/unit'
import { EmissionFactorImportVersion, Environment, Import, SubPost } from '@prisma/client'
import { PaginationState } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import EditEmissionFactorModal from './edit/EditEmissionFactorModal'
import { EmissionFactorsFilters } from './EmissionFactorsFilters'
import { EmissionFactorsTable } from './Table'

interface Props {
  userOrganizationId?: string | null
  environment: Environment
  selectEmissionFactor?: (emissionFactor: EmissionFactorWithMetaData) => void
}

const initialSelectedUnits: (BCUnit | string)[] = [...['all'], ...Object.values(BCUnit)]
const EmissionFactorsFiltersAndTable = ({ userOrganizationId, environment, selectEmissionFactor }: Props) => {
  const t = useTranslations('emissionFactors.table')
  const [action, setAction] = useState<'edit' | 'delete' | undefined>(undefined)
  const [targetedEmission, setTargetedEmission] = useState('')
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactorList[]>([])
  const [importVersions, setImportVersions] = useState<EmissionFactorImportVersion[]>([])
  const [skip, setSkip] = useState(0)
  const [take, setTake] = useState(25)
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
    sources: [] as string[],
    units: initialSelectedUnits,
    subPosts: envSubPosts,
  })

  const fromModal = !!selectEmissionFactor

  useEffect(() => {
    async function fetchEmissionFactors() {
      const takeValue = skip === 0 ? take * 4 : take
      const emissionFactorsFromBdd = await getEmissionFactors(skip, takeValue, filters)
      const importVersionsFromBdd = await getImportVersions()
      const manualImport = { id: Import.Manual, source: Import.Manual, name: '' }
      setImportVersions(importVersionsFromBdd.concat(manualImport as EmissionFactorImportVersion))
      setFilters((prevFilters) => ({
        ...prevFilters,
        sources:
          importVersionsFromBdd.length > 0
            ? [Import.Manual, ...importVersionsFromBdd.map((iv) => iv.id)]
            : [Import.Manual],
      }))
      setSkip((prevSkip) => takeValue + prevSkip)

      if (emissionFactorsFromBdd.success) {
        setEmissionFactors((prevEF) => prevEF.concat(emissionFactorsFromBdd.data.emissionFactors))
        setTotalCount(emissionFactorsFromBdd.data.count)
      } else {
        setEmissionFactors([])
        setTotalCount(0)
      }
    }

    if ((pagination.pageIndex + 1) * pagination.pageSize + 50 > skip + take) {
      fetchEmissionFactors()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emissionFactors.length, take, pagination.pageIndex])

  useEffect(() => {
    async function fetchEmissionFactors() {
      const emissionFactorsFromBdd = await getEmissionFactors(0, 100, filters)
      console.log(emissionFactorsFromBdd)
      setSkip(100)

      if (emissionFactorsFromBdd.success) {
        setPagination((prevPagination) => ({ ...prevPagination, pageIndex: 0 }))
        setEmissionFactors(emissionFactorsFromBdd.data.emissionFactors)
        setTotalCount(emissionFactorsFromBdd.data.count)
      } else {
        setEmissionFactors([])
        setTotalCount(0)
      }
    }

    console.log('filters changed:', filters)

    fetchEmissionFactors()
  }, [filters])

  useEffect(() => {
    setTake(pagination.pageSize)
  }, [pagination.pageSize])

  return (
    <>
      {t('subTitle')}
      <EmissionFactorsFilters
        emissionFactors={emissionFactors}
        fromModal={fromModal}
        importVersions={importVersions}
        initialSelectedUnits={initialSelectedUnits}
        envPosts={posts}
        filters={filters}
        setFilters={setFilters}
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
      <EditEmissionFactorModal emissionFactorId={targetedEmission} action={action} setAction={setAction} />
    </>
  )
}

export default EmissionFactorsFiltersAndTable
