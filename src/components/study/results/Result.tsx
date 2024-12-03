'use client'

import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { computeResultsByPost } from '@/services/results'
import { downloadStudyEmissionSources, downloadStudyPost } from '@/services/study'
import DownloadIcon from '@mui/icons-material/Download'
import { MenuItem, Select } from '@mui/material'
import Chart from 'chart.js/auto'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './Result.module.css'

interface Props {
  study: FullStudy
  isPost: boolean
}

const sort = (arr: string[]) => arr.sort((a, b) => a.length - b.length)

const Result = ({ study, isPost }: Props) => {
  const t = useTranslations('results')
  const tExport = useTranslations('study.export')
  const tPost = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')
  const [post, setPost] = useState<Post>(Object.values(Post)[0])
  const chartRef = useRef<Chart | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const selectorOptions = useMemo(() => (isPost ? [] : Object.values(Post)), [post])

  const xAxis = useMemo(() => (isPost ? sort(Object.keys(subPostsByPost)) : sort(subPostsByPost[post])), [post, isPost])

  const yData = useMemo(() => {
    const computedResults = computeResultsByPost(study, tPost)
    if (isPost) {
      const data = computedResults
        .sort((post1, post2) => post1.post.length - post2.post.length)
        .map((post) => post.value)

      if (data.every((totalEmissions) => totalEmissions === 0)) {
        return []
      }
      return data
    } else {
      const subPosts = computedResults.find((emissionPost) => emissionPost.post === post)?.subPosts || []
      const data = xAxis.map((subPost) => subPosts.find((subPostResult) => subPostResult.post === subPost)?.value || 0)
      if (data.every((totalEmissions) => totalEmissions === 0)) {
        return []
      }
      return data
    }
  }, [post, isPost])

  const dynamicMargin = useMemo(() => {
    const longestLabelLength = Math.max(...xAxis.map((label) => label.length))
    return { bottom: isPost ? 150 : longestLabelLength * 6 }
  }, [post])

  const dynamicHeight = useMemo(() => Math.min(dynamicMargin.bottom * 3, 500), [dynamicMargin])

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        chartRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: xAxis.map((post) => tPost(post)),
            datasets: [{ data: yData, backgroundColor: '#346fef' }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: { callbacks: { label: (context) => `${context.raw} kgCO₂e` } },
              legend: { display: false },
            },
            scales: {
              x: { ticks: { maxRotation: 45, minRotation: 45 } },
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
    if (isPost) {
      downloadStudyEmissionSources(study, tExport, tPost, tQuality)
    } else {
      const emissionSources = study.emissionSources
        .filter((emissionSource) => subPostsByPost[post as Post].includes(emissionSource.subPost))
        .sort((a, b) => a.subPost.localeCompare(b.subPost))
      downloadStudyPost(study, emissionSources, post, tExport, tPost, tQuality)
    }
  }

  return (
    <Box className="grow flex-col">
      <h4 className={styles.title}>{t(isPost ? 'byPost' : 'bySubPost')}</h4>
      {!isPost && (
        <div className={classNames(styles.buttons, 'flex mb1')}>
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
      <div style={{ width: 500, height: dynamicHeight }}>
        <canvas data-testid={`study-${isPost ? 'post' : 'subPost'}-chart`} className={styles.chart} ref={canvasRef} />
      </div>
    </Box>
  )
}

export default Result
