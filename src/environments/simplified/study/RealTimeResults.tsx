import { FullStudy } from '@/db/study'
import { usePublicodesResults } from '@/hooks/usePublicodesResults'
import { Post } from '@/services/posts'
import { Translations } from '@/types/translation'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { StudyResultUnit, SubPost } from '@prisma/client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'use-intl'
import styles from './RealTimeResults.module.css'

interface Props {
  post: Post
  subPost: SubPost | undefined
  study: FullStudy
  studySiteId: string
}

const formatValue = (value: number, unit: StudyResultUnit, t: Translations) => {
  return `${formatNumber(value / STUDY_UNIT_VALUES[unit])} ${t(unit)}`
}

const RealTimeResults = ({ post, subPost, study, studySiteId }: Props) => {
  const { bySite, refresh } = usePublicodesResults(study, 'all', study.organizationVersion.environment)
  const [updated, setUpdated] = useState(false)
  const [diff, setDiff] = useState<number>()
  const isFirstLoad = useRef(true)
  const prevResults = useRef<number>(undefined)

  const results = useMemo(() => {
    const postsResult = bySite[studySiteId]
    const total = postsResult?.find((r) => r.post === 'total')?.value
    const postResult = postsResult?.find((r) => r.post === post)
    const subPostResult = postResult?.children?.find((r) => r.post === subPost)
    return { total, subPostValue: subPostResult?.value, postValue: postResult?.value }
  }, [bySite, studySiteId, post, subPost])

  const { total, subPostValue, postValue } = results

  const tResultsUnits = useTranslations('study.results.units')
  const tPost = useTranslations('emissionFactors.post')

  useEffect(() => {
    if (total === undefined) {
      return
    }
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      prevResults.current = total
      return
    }
    if (total === prevResults.current) {
      return
    }

    setDiff(total !== undefined && prevResults.current !== undefined ? total - prevResults.current : undefined)

    prevResults.current = total
    setUpdated(true)
    const id = setTimeout(() => setUpdated(false), 1200)
    return () => clearTimeout(id)
  }, [total])

  useEffect(() => {
    const refetchId = setInterval(refresh, 5000)
    return () => clearInterval(refetchId)
  }, [refresh])

  return (
    <div className={`${styles.panel} ${updated ? styles.updated : ''}`}>
      {subPost && (
        <div className={styles.row}>
          <span className={styles.label}>{tPost(subPost)}</span>
          <span className={styles.value} key={subPostValue}>
            {subPostValue !== undefined ? formatValue(subPostValue, study.resultsUnit, tResultsUnits) : '—'}
          </span>
        </div>
      )}
      <div className={styles.divider} />
      {post && (
        <div className={styles.row}>
          <span className={styles.label}>{tPost(post)}</span>
          <span className={styles.value} key={postValue}>
            {postValue !== undefined ? formatValue(postValue, study.resultsUnit, tResultsUnits) : '—'}
          </span>
        </div>
      )}
      <div className={styles.divider} />
      <div className={styles.row}>
        <span className={styles.label}>{tPost('total')}</span>
        <span className={styles.value} key={total}>
          {total !== undefined ? formatValue(total, study.resultsUnit, tResultsUnits) : '—'}
          {diff !== undefined && diff !== 0 && (
            <span className={diff < 0 ? styles.diffSuccess : styles.diffError}>
              {diff > 0 ? '+' : ''}
              {formatValue(diff, study.resultsUnit, tResultsUnits)}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

export default RealTimeResults
