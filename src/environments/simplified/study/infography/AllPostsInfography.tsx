import { FullStudy } from '@/db/study'
import EnvironmentLoader from '@/environments/core/utils/EnvironmentLoader'
import { useServerFunction } from '@/hooks/useServerFunction'
import { ClicksonPost, CutPost, subPostsByPost } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { getEmissionValueString } from '@/utils/study'
import { styled } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SimplifiedPostInfography } from './SimplifiedPostInfography'

interface Props {
  study: FullStudy
  data: ResultsByPost[]
  user: UserSession
  posts?: typeof CutPost | typeof ClicksonPost
}

const StyledGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gridTemplateRows: 'repeat(3, 8.75rem)', // Fixed height allows overflow of subpost menu
  gap: '0.75rem',
  width: '100%',
  paddingBottom: '12rem',
})

const AllPostsInfography = ({ studySiteId, study, data, user, posts = CutPost }: Props) => {
  const [questionProgress, setQuestionProgress] = useState<StatsResult>({} as StatsResult)
  const { callServerFunction } = useServerFunction()

  const tUnits = useTranslations('study.results.units')
  const { engine, situation, isLoading } = useCutPublicodesSituation()

  const questionProgress = useMemo<StatsResult>(() => {
    if (!situation) {
      return {}
    }
    return getQuestionProgressBySubPost(
      engine,
      situation,
      getFormLayoutsForSubPost,
      subPostsByPostCUT as Record<Post, SubPost[]>,
    )
  }, [engine, situation])

  const renderedInfographies = useMemo(() => {
    return Object.values(posts).map((post) => {
      const subPostStats = questionProgress[post as CutPost | ClicksonPost] ?? {}
      let allAnswered = 0
      let allTotal = 0
      for (const stats of Object.values(subPostStats)) {
        allAnswered += stats?.answered ?? 0
        allTotal += stats?.total ?? 0
      }

      const completionRate = allTotal > 0 ? (allAnswered / allTotal) * 100 : 0

      const unit = tUnits(study.resultsUnit)
      const dataByPost = data.find((d) => d.post === post)
      const emissionValue = getEmissionValueString(dataByPost?.value, study.resultsUnit, unit)

      return (
        <SimplifiedPostInfography
          key={post}
          mainPost={post}
          emissionValue={emissionValue}
          percent={completionRate}
          post={post}
          studyId={study.id}
          subPosts={subPostsByPost[post as CutPost | ClicksonPost]}
          questionStats={questionProgress[post as CutPost | ClicksonPost]}
        />
      )
    })
  }, [questionProgress, tUnits, study.resultsUnit, study.id, data])

  if (isLoading) {
    return <EnvironmentLoader />
  }

  return <StyledGrid>{renderedInfographies}</StyledGrid>
}

export default AllPostsInfography
