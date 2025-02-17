'use client'

import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { computeResultsByPost, ResultsByPost } from '@/services/results/consolidated'
import { getUserSettings } from '@/services/serverFunctions/user'
import { formatNumber } from '@/utils/number'
import Chart from 'chart.js/auto'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import DependenciesSwitch from './DependenciesSwitch'
import styles from './Result.module.css'

interface Props {
  study: FullStudy
  studySite: string
  withDependenciesGlobal?: boolean
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

const Result = ({ study, studySite, withDependenciesGlobal }: Props) => {
  const t = useTranslations('emissionFactors.post')
  const [dynamicHeight, setDynamicHeight] = useState(0)
  const chartRef = useRef<Chart | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [withDependencies, setWithDependencies] = useState(
    withDependenciesGlobal === undefined ? true : withDependenciesGlobal,
  )
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

  useEffect(() => {
    if (withDependenciesGlobal !== undefined) {
      setWithDependencies(withDependenciesGlobal)
    }
  }, [withDependenciesGlobal])

  const xAxis = useMemo(() => postXAxisList, [withDependencies])

  const yData = useMemo(() => {
    const computedResults = computeResultsByPost(study, t, studySite, withDependencies, validatedOnly)
    if (computedResults.every((post) => post.value === 0)) {
      return []
    }
    return xAxis.map((post) => (computedResults.find((postResult) => postResult.post === post) as ResultsByPost).value)
  }, [studySite, withDependencies, validatedOnly])

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        chartRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: xAxis.map((post) => t(post)),
            datasets: [
              { data: yData, backgroundColor: getComputedStyle(document.body).getPropertyValue('--primary-40') },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: { callbacks: { label: (context) => `${formatNumber((context.raw as number) / 1000)} tCO₂e` } },
              legend: { display: false },
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
    <>
      <div className={classNames(styles.header, 'align-center', 'mb1')}>
        {withDependenciesGlobal === undefined && (
          <DependenciesSwitch withDependencies={withDependencies} setWithDependencies={setWithDependencies} />
        )}
      </div>
      <div style={{ height: dynamicHeight }}>
        <canvas data-testid={`study-Post-chart`} ref={canvasRef} />
      </div>
    </>
  )
}

export default Result
