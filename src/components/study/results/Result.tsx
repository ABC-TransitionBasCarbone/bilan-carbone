'use client'

import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import { FullStudy } from '@/db/study'
import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import { Post, subPostsByPost } from '@/services/posts'
import { downloadStudyEmissionSources, downloadStudyPost } from '@/services/study'
import DownloadIcon from '@mui/icons-material/Download'
import { MenuItem, Select } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import styles from './Result.module.css'

interface Props {
  emissionFactors: EmissionFactorWithMetaData[]
  study: FullStudy
  isPost: boolean
}

const Result = ({ emissionFactors, study, isPost }: Props) => {
  const t = useTranslations('results')
  const tExport = useTranslations('study.export')
  const tPost = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')
  const [post, setPost] = useState<Post>(Object.keys(subPostsByPost)[0] as Post)

  const selectorOptions: Post[] = useMemo(() => (isPost ? [] : (Object.keys(subPostsByPost) as Post[])), [post])

  const sort = (arr: string[]) => arr.sort((a, b) => a.length - b.length)
  const xAxis = useMemo(() => (isPost ? sort(Object.keys(subPostsByPost)) : sort(subPostsByPost[post])), [post, isPost])

  const yData = useMemo(() => {
    if (isPost) {
      const data = xAxis
        .map((post) =>
          study.emissionSources.filter((emissionSource) =>
            subPostsByPost[post as Post].includes(emissionSource.subPost),
          ),
        )
        .map((emissionSources) =>
          emissionSources.reduce((acc, emissionSource) => {
            const emissionFactor = emissionFactors.find(
              (emissionFactor) => emissionFactor.id === emissionSource.emissionFactor?.id,
            )
            return acc + (emissionSource.value || 0) * (emissionFactor?.totalCo2 || 0)
          }, 0),
        )
      if (data.every((totalEmissions) => totalEmissions === 0)) {
        return []
      }
      return data
    } else {
      const data = xAxis.map((subPost) =>
        study.emissionSources
          .filter((emissionSource) => emissionSource.subPost === subPost)
          .reduce((acc, emissionSource) => {
            const emissionFactor = emissionFactors.find(
              (emissionFactor) => emissionFactor.id === emissionSource.emissionFactor?.id,
            )
            return acc + (emissionSource.value || 0) * (emissionFactor?.totalCo2 || 0)
          }, 0),
      )
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
        <div className={classNames(styles.buttons, 'flex')}>
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
      <BarChart
        xAxis={[
          {
            scaleType: 'band',
            data: xAxis.map((post) => tPost(post)),
            tickLabelStyle: { angle: -45, textAnchor: 'end' },
          },
        ]}
        // TODO : add css class to properly use color
        series={[{ data: yData, color: '#346fef' }]}
        width={500}
        height={dynamicHeight}
        margin={dynamicMargin}
        slotProps={{
          loadingOverlay: { message: t('loading') },
          noDataOverlay: { message: t('noData') },
        }}
      />
    </Box>
  )
}

export default Result
