'use client'

import { BCPost, Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { useTheme } from '@mui/material'
import { axisClasses, BarChart } from '@mui/x-charts'
import { StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

interface Props {
  studySite: string
  computedResults: ResultsByPost[]
  resultsUnit: StudyResultUnit
}

const listPost = [
  Post.Energies,
  Post.DechetsDirects,
  Post.IntrantsBiensEtMatieres,
  Post.IntrantsServices,
  Post.AutresEmissionsNonEnergetiques,
  Post.Fret,
  Post.Deplacements,
  Post.Immobilisations,
  Post.UtilisationEtDependance,
  Post.FinDeVie,
]

const Result = ({ computedResults, resultsUnit }: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')
  const theme = useTheme()

  const { labels, values } = useMemo(() => {
    const filtered = computedResults
      .filter(({ post }) => listPost.includes(post as BCPost))
      .sort((a, b) => listPost.indexOf(a.post as BCPost) - listPost.indexOf(b.post as BCPost))

    const values = filtered.map(({ value }) => value / STUDY_UNIT_VALUES[resultsUnit])
    const labels = filtered.map(({ post }) => tPost(post))

    return { labels, values }
  }, [computedResults, resultsUnit, tPost])

  const chartSetting = {
    height: 450,
    sx: { [`.${axisClasses.left} .${axisClasses.label}`]: { transform: 'translate(-1rem, 0)' } },
    borderRadius: 10,
  }

  return (
    <BarChart
      xAxis={[
        {
          data: labels,
          height: 80,
          scaleType: 'band',
          tickLabelStyle: { angle: -20, fontSize: 10, textAnchor: 'end' },
          tickPlacement: 'extremities',
          tickLabelPlacement: 'middle',
        },
      ]}
      grid={{ horizontal: true }}
      axisHighlight={{ x: 'none' }}
      yAxis={[{ label: tUnits(resultsUnit) }]}
      series={[{ color: theme.palette.secondary.main, data: values }]}
      {...chartSetting}
    />
  )
}

export default Result
