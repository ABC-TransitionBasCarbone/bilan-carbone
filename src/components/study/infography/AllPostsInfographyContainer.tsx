import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import AllPostsInfographyCut from '@/environments/cut/study/infography/AllPostsInfography'
import AllPostsInfographyTilt from '@/environments/tilt/study/infography/AllPostsInfography'
import { BCPost, CutPost, TiltPost } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { getUserSettings } from '@/services/serverFunctions/user'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { Environment } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import AllPostsInfography from './AllPostsInfography'

interface Props {
  study: FullStudy
  studySite: string
  user: UserSession
}

const AllPostsInfographyContainer = ({ study, studySite, user }: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const [validatedOnly, setValidatedOnly] = useState(true)
  const { environment } = useAppEnvironmentStore()

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
    () =>
      computeResultsByPost(
        study,
        tPost,
        studySite,
        true,
        validatedOnly,
        environment === Environment.TILT ? TiltPost : undefined,
        environment,
      ),
    [study, tPost, studySite, validatedOnly, environment],
  )

  return (
    <DynamicComponent
      defaultComponent={<AllPostsInfography study={study} data={data} />}
      environmentComponents={{
        [Environment.CUT]: <AllPostsInfographyCut study={study} data={data} studySiteId={studySite} user={user} />,
        [Environment.TILT]: <AllPostsInfographyTilt study={study} data={data} />,
      }}
    />
  )
}

export default AllPostsInfographyContainer
