import { FullStudy } from '@/db/study'
import EnvironmentLoader from '@/environments/core/utils/EnvironmentLoader'
import { useCutPublicodesSituation } from '@/environments/cut/context/publicodesContext'
import { getQuestionProgressBySubPost, StatsResult } from '@/services/publicodes/questionProgress'
import { getSimplifiedPublicodesConfig } from '@/services/publicodes/simplifiedPublicodesConfig'
import { BaseResultsByPost } from '@/services/results/consolidated'
import { computeBaseResultsByPostFromEngine } from '@/services/results/publicodes'
import { getEmissionValueString } from '@/utils/study'
import { styled } from '@mui/material'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { SimplifiedPostInfography } from './SimplifiedPostInfography'

interface Props {
  study: FullStudy
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

const AllPostsInfography = ({ study, environment }: Props) => {
  const tUnits = useTranslations('study.results.units')
  const tPost = useTranslations('emissionFactors.post')
  const { engine, situation, isLoading } = useCutPublicodesSituation()
  const config = getSimplifiedPublicodesConfig(environment)

  const { questionProgress, publicodesResults } = useMemo<{
    questionProgress: StatsResult
    publicodesResults: BaseResultsByPost[]
  }>(() => {
    if (!situation || !config) {
      return {
        questionProgress: {},
        publicodesResults: [],
      }
    }

    return {
      questionProgress: getQuestionProgressBySubPost(engine, situation, config.subPostsByPost, config.getFormLayout),
      publicodesResults: computeBaseResultsByPostFromEngine(
        engine,
        config.posts,
        config.subPostsByPost,
        tPost,
        config.getPostRuleName,
        config.getSubPostRuleName,
      ),
    }
  }, [engine, situation, config, tPost])

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
      const postResult = publicodesResults.find((d) => d.post === post)
      const emissionValue = getEmissionValueString(postResult?.value, study.resultsUnit, unit)

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
  }, [questionProgress, tUnits, study.resultsUnit, study.id, publicodesResults, config])

  if (!config || isLoading) {
    return <EnvironmentLoader />
  }

  return <StyledGrid>{renderedInfographies}</StyledGrid>
}

export default AllPostsInfography
