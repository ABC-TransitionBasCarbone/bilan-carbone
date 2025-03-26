'use client'

import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { getUserSettings } from '@/services/serverFunctions/user'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { StudyResultUnit } from '@prisma/client'
import Chart from 'chart.js/auto'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

interface Props {
  studySite: string
  computedResults: ResultsByPost[]
  resultsUnit: StudyResultUnit
}

const postXAxisList = [
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
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')
  const [dynamicHeight, setDynamicHeight] = useState(0)
  const chartRef = useRef<Chart | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
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

  const xAxis = useMemo(() => postXAxisList, [])

  const yData = useMemo(() => {
    if (computedResults.every((post) => post.value === 0)) {
      return []
    }
    return xAxis.map(
      (post) =>
        (computedResults.find((postResult) => postResult.post === post) as ResultsByPost).value /
        STUDY_UNIT_VALUES[resultsUnit],
    )
  }, [studySite, validatedOnly, computedResults])

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        chartRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: xAxis.map((post) => tPost(post)),
            datasets: [
              {
                data: yData,
                backgroundColor: getComputedStyle(document.body).getPropertyValue('--primary-40'),
                label: tUnits(resultsUnit),
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => `${formatNumber(context.raw as number)} ${tUnits(resultsUnit)}`,
                },
              },
              legend: { display: true },
            },
            scales: {
              x: { afterUpdate: ({ height }) => setDynamicHeight(370 + (height || 0)) },
              y: { beginAtZero: true },
            },
          },
        })
      }
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [xAxis, yData])

  return (
    <div style={{ height: dynamicHeight }}>
      <canvas data-testid={`study-Post-chart`} ref={canvasRef} />
    </div>
  )
}

export default Result
