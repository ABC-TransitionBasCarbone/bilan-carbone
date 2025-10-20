'use client'

import { Post } from '@/services/posts'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { EmissionFactorImportVersion, Environment, SubPost } from '@prisma/client'
import { OnChangeFn, PaginationState } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import EditEmissionFactorModal from './edit/EditEmissionFactorModal'
import { EmissionFactorsFilters } from './EmissionFactorsFilters'
import { EmissionFactorsTable } from './Table'

interface Props {
  emissionFactors: EmissionFactorWithMetaData[]
  selectEmissionFactor?: (emissionFactor: EmissionFactorWithMetaData) => void
  importVersions: EmissionFactorImportVersion[]
  initialSelectedSources: string[]
  userOrganizationId?: string | null
  initialSelectedSubPosts: SubPost[]
  environment: Environment
  envPosts: Post[]
  pagination: PaginationState
  setPagination: OnChangeFn<PaginationState>
  totalCount: number
}

const EmissionFactorsFiltersAndTable = ({
  emissionFactors,
  selectEmissionFactor,
  userOrganizationId,
  importVersions,
  initialSelectedSources,
  initialSelectedSubPosts,
  environment,
  envPosts,
  pagination,
  setPagination,
  totalCount,
}: Props) => {
  const t = useTranslations('emissionFactors.table')
  const [action, setAction] = useState<'edit' | 'delete' | undefined>(undefined)
  const [targetedEmission, setTargetedEmission] = useState('')
  const fromModal = !!selectEmissionFactor

  return (
    <>
      {t('subTitle')}
      <EmissionFactorsFilters
        emissionFactors={emissionFactors}
        fromModal={fromModal}
        importVersions={importVersions}
        initialSelectedSources={initialSelectedSources}
        initialSelectedSubPosts={initialSelectedSubPosts}
        envPosts={envPosts}
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
