'use client'

import Button from '@/components/base/Button'
import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { computeResultsByPost, ResultsByPost } from '@/services/results/consolidated'
import { downloadStudyEmissionSources, downloadStudyPost } from '@/services/study'
import { formatNumber } from '@/utils/number'
import DownloadIcon from '@mui/icons-material/Download'
import { MenuItem, Select } from '@mui/material'
import { SubPost } from '@prisma/client'
import Chart from 'chart.js/auto'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import DependenciesSwitch from './DependenciesSwitch'
import styles from './Result.module.css'

interface Props {
  study: FullStudy
  by: 'Post' | 'SubPost'
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

const Result = ({ study, by, studySite, withDependenciesGlobal }: Props) => {
  const t = useTranslations('results')
  const tExport = useTranslations('study.export')
  const tCaracterisations = useTranslations('categorisations')
  const tPost = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')
  const tUnit = useTranslations('units')
  const [dynamicHeight, setDynamicHeight] = useState(0)
  const [post, setPost] = useState<Post>(Object.values(Post)[0])
  const chartRef = useRef<Chart | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [withDependencies, setWithDependencies] = useState(
    withDependenciesGlobal === undefined ? true : withDependenciesGlobal,
  )

  useEffect(() => {
    if (withDependenciesGlobal !== undefined) {
      setWithDependencies(withDependenciesGlobal)
    }
  }, [withDependenciesGlobal])

  const selectorOptions = Object.values(Post)

  const xAxis = useMemo(
    () =>
      by === 'Post'
        ? postXAxisList
        : subPostsByPost[post].filter((subPost) => withDependencies || subPost !== SubPost.UtilisationEnDependance),
    [post, by, withDependencies],
  )

  const yData = useMemo(() => {
    const computedResults = computeResultsByPost(study, tPost, studySite, withDependencies)
    if (by === 'Post') {
      if (computedResults.every((post) => post.value === 0)) {
        return []
      }
      return xAxis.map(
        (post) => (computedResults.find((postResult) => postResult.post === post) as ResultsByPost).value,
      )
    } else {
      const subPosts = (computedResults.find((emissionPost) => emissionPost.post === post) as ResultsByPost).subPosts
      if (subPosts.every((subPost) => subPost.value === 0)) {
        return []
      }
      return xAxis
        .filter((subPost) => withDependencies || subPost !== SubPost.UtilisationEnDependance)
        .map((subPost) => subPosts.find((subPostResult) => subPostResult.post === subPost)?.value || 0)
    }
  }, [post, by, studySite, withDependencies])

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        chartRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: xAxis.map((post) => tPost(post)),
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
              // add 70px tot the height for the Post because of the selector and download button in the SubPost
              x: { afterUpdate: ({ height }) => setDynamicHeight((by === 'Post' ? 370 : 300) + (height || 0)) },
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

  const downloadResults = () => {
    if (by === 'Post') {
      downloadStudyEmissionSources(study, tExport, tCaracterisations, tPost, tQuality, tUnit)
    } else {
      const emissionSources = study.emissionSources.filter((emissionSource) =>
        subPostsByPost[post].includes(emissionSource.subPost),
      )
      downloadStudyPost(study, emissionSources, post, tExport, tCaracterisations, tPost, tQuality, tUnit)
    }
  }

  return (
    <>
      <div className={classNames(styles.header, 'align-center', 'mb1')}>
        <h3>{t(`by${by}`)}</h3>
        {withDependenciesGlobal === undefined && (
          <DependenciesSwitch withDependencies={withDependencies} setWithDependencies={setWithDependencies} />
        )}
      </div>
      {by === 'SubPost' && (
        <div className="flex mb1">
          <Select className="mr-2 grow" value={post} onChange={(e) => setPost(e.target.value as Post)}>
            {selectorOptions.map((post) => (
              <MenuItem key={post} value={post}>
                {tPost(post)}
              </MenuItem>
            ))}
          </Select>
          <Button disabled={!yData.find((data) => data !== 0)} onClick={downloadResults}>
            <DownloadIcon />
          </Button>
        </div>
      )}
      <div style={{ height: dynamicHeight }}>
        <canvas data-testid={`study-${by}-chart`} ref={canvasRef} />
      </div>
    </>
  )
}

export default Result
