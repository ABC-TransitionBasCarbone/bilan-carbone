import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { typeDynamicComponent } from '@/environments/core/utils/dynamicUtils'
import AllPostsInfographySimplified from '@/environments/simplified/study/infography/AllPostsInfography'
import AllPostsInfographyTilt from '@/environments/tilt/study/infography/AllPostsInfography'
import { ClicksonPost, CutPost, TiltPost } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { getUserSettings } from '@/services/serverFunctions/user'
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

  const environment = useMemo(() => study.organizationVersion.environment, [study])

  const data = useMemo(
    () =>
      computeResultsByPost(
        study,
        tPost,
        studySite,
        true,
        validatedOnly,
        environment === Environment.TILT ? TiltPost : environment === Environment.CUT ? CutPost : undefined,
        environment,
      ),
    [study, tPost, studySite, validatedOnly, environment],
  )

  return (
    <DynamicComponent
      defaultComponent={typeDynamicComponent({ component: AllPostsInfography, props: { study, data } })}
      environment={environment}
      environmentComponents={{
        [Environment.CUT]: typeDynamicComponent({
          component: AllPostsInfographySimplified,
          props: { study, data, studySiteId: studySite, user },
        }),
        [Environment.TILT]: typeDynamicComponent({ component: AllPostsInfographyTilt, props: { study, data } }),
        [Environment.CLICKSON]: typeDynamicComponent({
          component: AllPostsInfographySimplified,
          props: {
            posts: ClicksonPost,
            study,
            data,
            studySiteId: studySite,
            user,
          },
        }),
      }}
    />
  )
}

export default AllPostsInfographyContainer
