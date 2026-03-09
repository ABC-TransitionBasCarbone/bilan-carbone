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
  const [diffs, setDiffs] = useState<{ total?: number; subPost?: number }>({})
  const isFirstLoad = useRef(true)
  const prevResults = useRef<{ total?: number; subPost?: number }>({})

  const results = useMemo(() => {
    const postsResult = bySite[studySiteId]
    const total = postsResult?.find((r) => r.post === 'total')?.value
    const postResult = postsResult?.find((r) => r.post === post)
    const subPostResult = postResult?.children?.find((r) => r.post === subPost)
    return { total, subPost: subPostResult?.value }
  }, [bySite, studySiteId, post, subPost])

  const { total, subPost: subValue } = results

  const tResultsUnits = useTranslations('study.results.units')
  const tPost = useTranslations('emissionFactors.post')

  useEffect(() => {
    if (total === undefined && subValue === undefined) {
      return
    }
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      prevResults.current = { total, subPost: subValue }
      return
    }
    if (total === prevResults.current.total && subValue === prevResults.current.subPost) {
      return
    }

    setDiffs({
      total:
        total !== undefined && prevResults.current.total !== undefined ? total - prevResults.current.total : undefined,
      subPost:
        subValue !== undefined && prevResults.current.subPost !== undefined
          ? subValue - prevResults.current.subPost
          : undefined,
    })

    prevResults.current = { total, subPost: subValue }
    setUpdated(true)
    const id = setTimeout(() => setUpdated(false), 1200)
    return () => clearTimeout(id)
  }, [total, subValue])

  useEffect(() => {
    const refetchId = setInterval(refresh, 5000)
    return () => clearInterval(refetchId)
  }, [refresh])

  return (
    <div className={`${styles.panel} ${updated ? styles.updated : ''}`}>
      <div className={styles.row}>
        <span className={styles.label}>{tPost('total')}</span>
        <span className={styles.value} key={total}>
          {total !== undefined ? formatValue(total, study.resultsUnit, tResultsUnits) : '—'}
          {diffs.total !== undefined && diffs.total !== 0 && (
            <span className={diffs.total < 0 ? styles.diffSuccess : styles.diffError}>
              {diffs.total > 0 ? '+' : ''}
              {formatValue(diffs.total, study.resultsUnit, tResultsUnits)}
            </span>
          )}
        </span>
      </div>
      <div className={styles.divider} />
      {subPost && (
        <div className={styles.row}>
          <span className={styles.label}>{tPost(subPost)}</span>
          <span className={styles.value} key={subValue}>
            {subValue !== undefined ? formatValue(subValue, study.resultsUnit, tResultsUnits) : '—'}
          </span>
        </div>
      )}
    </div>
  )
}

export default RealTimeResults
