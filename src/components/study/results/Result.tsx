'use client'

import Button from '@/components/base/Button'
import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { computeResultsByPost, ResultsByPost } from '@/services/results/consolidated'
import { downloadStudyEmissionSources, downloadStudyPost } from '@/services/study'
import DownloadIcon from '@mui/icons-material/Download'
import { MenuItem, Select } from '@mui/material'
import Chart from 'chart.js/auto'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

interface Props {
  study: FullStudy
  by: 'Post' | 'SubPost'
  site: string
}

const postXAxisList = [
  Post.Energies,
  Post.DechetsDirects,
  Post.IntrantsBienEtMatieres,
  Post.IntrantsServices,
  Post.AutresEmissionsNonEnergetiques,
  Post.Fret,
  Post.Deplacements,
  Post.Immobilisations,
  Post.UtilisationEtDependance,
  Post.FinDeVie,
]

const Result = ({ study, by, site }: Props) => {
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

  const selectorOptions = Object.values(Post)

  const xAxis = useMemo(() => (by === 'Post' ? postXAxisList : subPostsByPost[post]), [post, by])

  const yData = useMemo(() => {
    const computedResults = computeResultsByPost(study, tPost, site)
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
      return xAxis.map((subPost) => subPosts.find((subPostResult) => subPostResult.post === subPost)?.value || 0)
    }
  }, [post, by, site])

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
              tooltip: { callbacks: { label: (context) => `${context.raw} kgCO₂e` } },
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
      <h3 className="mb1">{t(`by${by}`)}</h3>
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
