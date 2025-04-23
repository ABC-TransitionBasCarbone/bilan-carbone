'use client'

import { BCPost, Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { getUserSettings } from '@/services/serverFunctions/user'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { Box } from '@mui/material'
import { BarChart, BarLabel } from '@mui/x-charts'
import { StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState, useTransition } from 'react'

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
  const [_, setValidatedOnly] = useState(true)
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')




  useEffect(() => {
    applyUserSettings()
  }, [])

  const applyUserSettings = async () => {
    const validatedOnlySetting = (await getUserSettings())?.validatedEmissionSourcesOnly
    if (validatedOnlySetting !== undefined) {
      setValidatedOnly(validatedOnlySetting)
    }
  }

  const { labels, values } = useMemo(() => {
    const filtered = computedResults
      .filter(({ post }) => listPost.includes(post as BCPost))
    const values = filtered.map(({ value }) => value / STUDY_UNIT_VALUES[resultsUnit])
    const labels = filtered.map(({ post }) => tPost(post))
    return { labels, values }
  }, [computedResults])

  const chartSetting = {
    height: 400,
    width: 600
  };

  return (
    <Box>
      <BarChart
        xAxis={
          [
            {
              data: labels,
              scaleType: 'band',
              tickLabelStyle: {
                angle: -20,
                fontSize: 10,
                textAnchor: 'end'
              },
              tickPlacement: 'extremities',
              tickLabelPlacement: 'middle'
            },
          ]}
        grid={{ vertical: true, horizontal: true }}
        axisHighlight={{ x: 'none' }}
        series={[{ data: values }]}
        margin={{ bottom: 100, left: 80 }}
        {...chartSetting}
      >
      </BarChart>
    </Box >
  )
}

export default Result
