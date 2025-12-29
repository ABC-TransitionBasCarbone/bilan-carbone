import { FullStudy } from '@/db/study'
import EnvironmentLoader from '@/environments/core/utils/EnvironmentLoader'
import { useCutPublicodesSituation } from '@/environments/cut/context/publicodesContext'
import { getQuestionProgressBySubPost, StatsResult } from '@/services/publicodes/questionProgress'
import { getSimplifiedPublicodesConfig } from '@/services/publicodes/simplifiedPublicodesConfig'
import { ResultsByPost } from '@/services/results/consolidated'
import { getEmissionValueString } from '@/utils/study'
import { styled } from '@mui/material'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { SimplifiedPostInfography } from './SimplifiedPostInfography'

interface Props {
  study: FullStudy
  data: ResultsByPost[]
  environment: Environment
}

const StyledGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gridTemplateRows: 'repeat(3, 8.75rem)', // Fixed height allows overflow of subpost menu
  gap: '0.75rem',
  width: '100%',
  paddingBottom: '12rem',
})

const AllPostsInfography = ({ study, data, environment }: Props) => {
  const tUnits = useTranslations('study.results.units')
  const { engine, situation, isLoading } = useCutPublicodesSituation()
  const config = getSimplifiedPublicodesConfig(environment)

  const questionProgress = useMemo<StatsResult>(() => {
    if (!situation || !config) {
      return {}
    }
    return getQuestionProgressBySubPost(engine, situation, config.subPostsByPost, config.getFormLayout)
  }, [engine, situation, config])

  const renderedInfographies = useMemo(() => {
    if (!config) {
      return []
    }

    return config.posts.map((post) => {
      const subPostStats = questionProgress[post] ?? {}
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
          subPosts={config.subPostsByPost[post] ?? null}
          questionStats={questionProgress[post] ?? {}}
        />
      )
    })
  }, [questionProgress, tUnits, study.resultsUnit, study.id, data, config])

  if (!config || isLoading) {
    return <EnvironmentLoader />
  }

  return <StyledGrid>{renderedInfographies}</StyledGrid>
}

export default AllPostsInfography
