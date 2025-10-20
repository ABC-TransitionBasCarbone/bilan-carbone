'use client'

import { EmissionFactorList } from '@/db/emissionFactors'
import { environmentSubPostsMapping, Post } from '@/services/posts'
import { getEmissionFactors, mapImportVersions } from '@/services/serverFunctions/emissionFactor'
import { EmissionFactorImportVersion, Environment, Import } from '@prisma/client'
import { PaginationState } from '@tanstack/react-table'
import { UserSession } from 'next-auth'
import { useEffect, useMemo, useState } from 'react'
import EmissionFactorsTable from './Table'

interface Props {
  userOrganizationId?: string
  manualOnly: boolean
  environment: Environment
  user: UserSession
}

const EmissionFactors = ({ userOrganizationId, manualOnly, environment }: Props) => {
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactorList[]>([])
  const [importVersions, setImportVersions] = useState<EmissionFactorImportVersion[]>([])
  const [skip, setSkip] = useState(0)
  const [take, setTake] = useState(25)
  const [totalCount, setTotalCount] = useState(0)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  useEffect(() => {
    async function fetchEmissionFactors() {
      const emissionFactorsFromBdd = await getEmissionFactors(skip, skip === 0 ? take * 4 : take)
      setSkip((prevSkip) => (prevSkip === 0 ? take * 4 : prevSkip + take))

      if (emissionFactorsFromBdd.success) {
        if (emissionFactors.length === 0) {
          setImportVersions(await mapImportVersions(emissionFactorsFromBdd.data.emissionFactors))
        }
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
    console.log('updateTake', pagination.pageSize)
    setTake(pagination.pageSize)
  }, [pagination.pageSize])

  const manualImport = { id: Import.Manual, source: Import.Manual, name: '' } as EmissionFactorImportVersion

  const initialSelectedSources = useMemo(() => {
    return importVersions
      .filter(
        (importVersion) =>
          importVersion.source === Import.Manual ||
          (!manualOnly &&
            importVersion.id ===
              importVersions
                .filter((v) => v.source === importVersion.source)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].id),
      )
      .map((importVersion) => importVersion.id)
  }, [importVersions, manualOnly])

  const subPostsByPost = useMemo(() => environmentSubPostsMapping[environment], [environment])
  const initialSelectedSubPosts = useMemo(
    () => Object.values(subPostsByPost).flatMap((subPosts) => subPosts),
    [subPostsByPost],
  )
  const posts = useMemo(() => Object.keys(subPostsByPost) as Post[], [subPostsByPost])

  return (
    <EmissionFactorsTable
      emissionFactors={emissionFactors}
      userOrganizationId={userOrganizationId}
      importVersions={importVersions.concat([manualImport])}
      initialSelectedSources={initialSelectedSources.concat([manualImport.id])}
      environment={environment}
      envPosts={posts}
      initialSelectedSubPosts={initialSelectedSubPosts}
      pagination={pagination}
      setPagination={setPagination}
      totalCount={totalCount}
    />
  )
}

export default EmissionFactors
