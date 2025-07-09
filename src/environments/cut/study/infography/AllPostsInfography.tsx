import { FullStudy } from '@/db/study'
import EnvironmentLoader from '@/environments/core/utils/EnvironmentLoader'
import { CutPost, subPostsByPost } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { getQuestionProgressBySubPostPerPost, StatsResult } from '@/services/serverFunctions/question'
import { getEmissionValueString } from '@/utils/study'
import { styled } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { CutPostInfography } from './CutPostInfography'

interface Props {
  study: FullStudy
  data: ResultsByPost[]
}

const StyledGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gridTemplateRows: 'repeat(3, 8.75rem)', // Fixed height allows overflow of subpost menu
  gap: '0.75rem',
  width: '100%',
  paddingBottom: '12rem',
})

const AllPostsInfography = ({ study, data }: Props) => {
  const [questionProgress, setQuestionProgress] = useState<StatsResult | null>(null)

  const tUnits = useTranslations('study.results.units')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const response = await getQuestionProgressBySubPostPerPost()
      if (response.success) {
        setQuestionProgress(response.data)
      }
      setIsLoading(false)
    }
    fetchData()
  }, [])

  if (isLoading || !questionProgress) {
    return <EnvironmentLoader />
  }

  return (
    <StyledGrid>
      {Object.values(CutPost).map((cutPost) => {
        const subPostStats = questionProgress[cutPost] ?? {}

        // Une seule itération pour answered et total
        let allAnswered = 0
        let allTotal = 0
        for (const stats of Object.values(subPostStats)) {
          allAnswered += stats?.answered ?? 0
          allTotal += stats?.total ?? 0
        }

        const completionRate = allTotal > 0 ? (allAnswered / allTotal) * 100 : 0

        const unit = tUnits(study.resultsUnit)
        const emissionValue = getEmissionValueString(
          data.find((d) => d.post === cutPost)?.value,
          study.resultsUnit,
          unit,
        )

        return (
          <CutPostInfography
            key={cutPost}
            mainPost={cutPost}
            emissionValue={emissionValue}
            percent={completionRate}
            post={cutPost}
            studyId={study.id}
            subPosts={subPostsByPost[cutPost]}
          />
        )
      })}
    </StyledGrid>
  )
}

export default AllPostsInfography
