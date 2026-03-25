import type { FullStudy } from '@/db/study'
import EnvironmentLoader from '@/environments/core/utils/EnvironmentLoader'
import { usePublicodesSituation } from '@/lib/publicodes/context'
import { mappedTiltSituationToCustomDataFields } from '@/services/customDataToSituation'
import { isTilt } from '@/services/permissions/environment'
import { getQuestionProgressBySubPost, StatsResult } from '@/services/publicodes/questionProgress'
import { BaseResultsByPost } from '@/services/results/consolidated'
import { computeBaseResultsByPostFromEngine } from '@/services/results/publicodes'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { getEmissionValueString } from '@/utils/study'
import { styled, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { SimplifiedPostInfography } from './SimplifiedPostInfography'

interface Props {
  study: FullStudy
}

const StyledGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gridTemplateRows: 'repeat(3, 8.75rem)', // Fixed height allows overflow of subpost menu
  gap: '0.75rem',
  width: '100%',
  paddingBottom: '12rem',
})

const AllPostsInfography = ({ study }: Props) => {
  const tUnits = useTranslations('study.results.units')
  const tPost = useTranslations('emissionFactors.post')
  const t = useTranslations('emissionFactors')
  const { engine, situation, listLayoutSituations, config, isLoading } = usePublicodesSituation()
  const { environment } = useAppEnvironmentStore()
  const [forbidDataEntry, setForbidDataEntry] = useState(false)

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
      questionProgress: getQuestionProgressBySubPost(
        engine,
        listLayoutSituations,
        config.subPostsByPost,
        config.getFormLayout,
      ),
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

  useEffect(() => {
    if (environment && isTilt(environment)) {
      const mappedKeys = Object.keys(mappedTiltSituationToCustomDataFields)
      const situationKeys = Object.keys(engine.getSituation())
      const allMappedKeysUsed = mappedKeys.every((key) => situationKeys.includes(key))
      if (allMappedKeysUsed) {
        setForbidDataEntry(false)
      } else {
        setForbidDataEntry(true)
      }
    }
  }, [situation, environment])

  if (!config || isLoading) {
    return <EnvironmentLoader />
  }

  if (forbidDataEntry) {
    return <Typography>{t('forbidden')}</Typography>
  }

  return <StyledGrid>{renderedInfographies}</StyledGrid>
}

export default AllPostsInfography
