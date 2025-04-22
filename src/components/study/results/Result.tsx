'use client'

import { BCPost, Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { getUserSettings } from '@/services/serverFunctions/user'
import { Box } from '@mui/material'
import { BarChart } from '@mui/x-charts'
import { StudyResultUnit } from '@prisma/client'
import { useEffect, useMemo, useState } from 'react'

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

const Result = ({ studySite, computedResults, resultsUnit }: Props) => {
  const [_, setValidatedOnly] = useState(true)

  useEffect(() => {
    applyUserSettings()
  }, [])

  const applyUserSettings = async () => {
    const validatedOnlySetting = (await getUserSettings())?.validatedEmissionSourcesOnly
    if (validatedOnlySetting !== undefined) {
      setValidatedOnly(validatedOnlySetting)
    }
  }

  const data = useMemo(() => {
    return computedResults
      .filter(({ post }) => listPost.includes(post as BCPost))
      .map(({ post, value }) => ({ label: post, value: value / 1000 }))
  }, [computedResults])

  return (
    <Box>
      <BarChart
        dataset={data}
        xAxis={[
          {
            scaleType: 'band',
            dataKey: 'label',
            colorMap: {
              type: 'ordinal',
              colors: [getComputedStyle(document.body).getPropertyValue('--primary-500')],
            },
            tickLabelStyle: {
              angle: -20,
              fontSize: 10,
              translate: '0 20px',
            },
          },
        ]}
        series={[{ dataKey: 'value' }]}
        height={400}
        width={800}
        margin={{ top: 50, right: 50, bottom: 80, left: 50 }}
      />
    </Box>
  )
}

export default Result
