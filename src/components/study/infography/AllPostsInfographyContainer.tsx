import { FullStudy } from '@/db/study'
import AllPostsInfographyClickson from '@/environments/clickson/study/infography/AllPostsInfography'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { CutPublicodesSituationProvider } from '@/environments/cut/context/publicodesContext'
import AllPostsInfographyCut from '@/environments/cut/study/infography/AllPostsInfography'
import AllPostsInfographyTilt from '@/environments/tilt/study/infography/AllPostsInfography'
import { CutPost, TiltPost } from '@/services/posts'
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
      defaultComponent={<AllPostsInfography study={study} data={data} />}
      environmentComponents={{
        [Environment.CUT]: (
          <CutPublicodesSituationProvider studyId={study.id} studySiteId={studySite}>
            <AllPostsInfographyCut study={study} data={data} />
          </CutPublicodesSituationProvider>
        ),
        [Environment.TILT]: <AllPostsInfographyTilt study={study} data={data} />,
        [Environment.CLICKSON]: <AllPostsInfographyClickson study={study} data={data} />,
      }}
    />
  )
}

export default AllPostsInfographyContainer
