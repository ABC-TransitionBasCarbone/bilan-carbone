import { FullStudy } from '@/db/study'
import EnvironmentLoader from '@/environments/core/utils/EnvironmentLoader'
import { CutPost, Post, subPostsByPost, subPostsByPostCUT } from '@/services/posts'
import { getQuestionProgressBySubPost, StatsResult } from '@/services/publicodes/questionProgress'
import { ResultsByPost } from '@/services/results/consolidated'
import { getEmissionValueString } from '@/utils/study'
import { styled } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { useCutPublicodesSituation } from '../../context/CutPublicodesSituationProvider'
import { getFormLayoutsForSubPost } from '../../publicodes/subPostMapping'
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
    return Object.values(CutPost).map((cutPost) => {
      const subPostStats = questionProgress[cutPost] ?? {}
      let allAnswered = 0
      let allTotal = 0
      for (const stats of Object.values(subPostStats)) {
        allAnswered += stats?.answered ?? 0
        allTotal += stats?.total ?? 0
      }

      const completionRate = allTotal > 0 ? (allAnswered / allTotal) * 100 : 0

      const unit = tUnits(study.resultsUnit)
      const dataByPost = data.find((d) => d.post === cutPost)
      const emissionValue = getEmissionValueString(dataByPost?.value, study.resultsUnit, unit)

      return (
        <CutPostInfography
          key={cutPost}
          mainPost={cutPost}
          emissionValue={emissionValue}
          percent={completionRate}
          post={cutPost}
          studyId={study.id}
          subPosts={subPostsByPost[cutPost]}
          questionStats={questionProgress[cutPost] ?? {}}
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
