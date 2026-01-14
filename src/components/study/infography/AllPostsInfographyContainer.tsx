import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { CutPublicodesSituationProvider } from '@/environments/cut/context/publicodesContext'
import AllPostsInfographySimplified from '@/environments/simplified/study/infography/AllPostsInfography'
import AllPostsInfographyTilt from '@/environments/tilt/study/infography/AllPostsInfography'
import { CutPost, TiltPost } from '@/services/posts'
import { computeResultsByPostFromEmissionSources } from '@/services/results/consolidated'
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
      computeResultsByPostFromEmissionSources(
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
            <AllPostsInfographySimplified study={study} environment={Environment.CUT} />
          </CutPublicodesSituationProvider>
        ),
        [Environment.TILT]: <AllPostsInfographyTilt study={study} data={data} />,
        [Environment.CLICKSON]: (
          // TODO: implement Clickson Publicodes context when available or
          // adapt the existing one to be parametrized by the current environment.
          <AllPostsInfographySimplified study={study} environment={Environment.CLICKSON} />
        ),
      }}
    />
  )
}

export default AllPostsInfographyContainer
