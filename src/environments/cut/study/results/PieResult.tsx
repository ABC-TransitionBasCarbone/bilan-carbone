'use client'

import { CutPost } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { getUserSettings } from '@/services/serverFunctions/user'
import { formatNumber } from '@/utils/number'
import { Box } from '@mui/material'
import { StudyResultUnit } from '@prisma/client'
import Chart from 'chart.js/auto'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

interface Props {
  studySite: string
  computedResults: ResultsByPost[]
  resultsUnit: StudyResultUnit
}

const getColor = (value: string) => {
  return getComputedStyle(document.body).getPropertyValue(value)
}

export default function PieResult({ studySite, computedResults, resultsUnit }: Props) {
  const [backgroundColor] = useState<string[]>([
    getColor('--primary-500'),
    getColor('--neutral-500'),
    getColor('--success-50'),
    getColor('--errror-50'),
    getColor('--post-darkBlue-light'),
    getColor('--info'),
    getColor('--post-orange-dark'),
  ])
  const tUnits = useTranslations('study.results.units')
  const chartRef = useRef<Chart | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [validatedOnly, setValidatedOnly] = useState(true)

  const applyUserSettings = async () => {
    const validatedOnlySetting = (await getUserSettings())?.validatedEmissionSourcesOnly
    if (validatedOnlySetting !== undefined) {
      setValidatedOnly(validatedOnlySetting)
    }
  }

  const [labels, data] = useMemo(() => {
    if (computedResults.every((post) => post.value === 0)) {
      return [[], []]
    }

    const validPosts = new Set(Object.values(CutPost))

    const filtered = computedResults.filter((result) => validPosts.has(result.post as CutPost) && result.value > 0)

    const labels = filtered.map((result) => result.post)
    const data = filtered.map((result) => result.value)

    return [labels, data]
  }, [studySite, validatedOnly, computedResults])

  useEffect(() => {
    applyUserSettings()
  }, [])

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        chartRef.current = new Chart(ctx, {
          type: 'pie',
          data: {
            labels,
            datasets: [
              {
                data,
                backgroundColor,
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
              legend: { display: true, position: 'right' },
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
  }, [labels, data])

  return (
    <Box component="div">
      <canvas data-testid={`study-post-pie-chart`} ref={canvasRef} />
    </Box>
  )
}
