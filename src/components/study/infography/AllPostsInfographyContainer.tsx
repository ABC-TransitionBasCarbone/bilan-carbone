import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import AllPostsInfographyCut from '@/environments/cut/study/infography/AllPostsInfography'
import { computeResultsByPost } from '@/services/results/consolidated'
import { getUserSettings } from '@/services/serverFunctions/user'
import { CUT } from '@/store/AppEnvironment'
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
    const validatedOnlySetting = (await getUserSettings())?.validatedEmissionSourcesOnly
    if (validatedOnlySetting !== undefined) {
      setValidatedOnly(validatedOnlySetting)
    }
  }

  const data = useMemo(
    () => computeResultsByPost(study, tPost, studySite, true, validatedOnly),
    [study, tPost, studySite, validatedOnly],
  )

  return (
    <DynamicComponent
      defaultComponent={<AllPostsInfography study={study} data={data} />}
      environmentComponents={{ [CUT]: <AllPostsInfographyCut study={study} data={data} /> }}
    />
  )
}

export default AllPostsInfographyContainer
