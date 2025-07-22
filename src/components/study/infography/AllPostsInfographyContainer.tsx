import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { default as AllPostsInfographyCut } from '@/environments/cut/study/infography/AllPostsInfography'
import { BCPost, CutPost } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { getUserSettings } from '@/services/serverFunctions/user'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import AllPostsInfography from './AllPostsInfography'

interface Props {
  study: FullStudy
  studySite: string
}

const AllPostsInfographyContainer = ({ study, studySite }: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const [validatedOnly, setValidatedOnly] = useState(true)

  useEffect(() => {
    applyUserSettings()
  }, [])

  const applyUserSettings = async () => {
    const userSettings = await getUserSettings()
    const validatedOnlySetting = userSettings.success ? userSettings.data?.validatedEmissionSourcesOnly : undefined
    if (validatedOnlySetting !== undefined) {
      setValidatedOnly(validatedOnlySetting)
    }
  }

  const post = useMemo(() => {
    switch (study.organizationVersion.environment) {
      case Environment.CUT:
        return CutPost
      default:
        return BCPost
    }
  }, [study.organizationVersion.environment])

  const data = useMemo(
    () => computeResultsByPost(study, tPost, studySite, true, validatedOnly, post),
    [study, tPost, studySite, validatedOnly, post],
  )

  return (
    <DynamicComponent
      defaultComponent={<AllPostsInfography study={study} data={data} />}
      environmentComponents={{
        [Environment.CUT]: <AllPostsInfographyCut studySiteId={studySite} study={study} data={data} />,
      }}
    />
  )
}

export default AllPostsInfographyContainer
