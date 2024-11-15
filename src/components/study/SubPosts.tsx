'use client'

import { Post, subPostsByPost } from '@/services/posts'
import { FullStudy } from '@/db/study'
import React, { useEffect, useMemo, useState } from 'react'
import styles from './SubPosts.module.css'
import classNames from 'classnames'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useTranslations } from 'next-intl'
import EmissionSource from './EmissionSource'
import NewEmissionSource from './NewEmissionSource'
import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import { getEmissionsFactor } from '@/services/serverFunctions/emissionFactor'

interface Props {
  post: Post
  study: FullStudy
}

const SubPosts = ({ post, study }: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const t = useTranslations('study.post')

  const subPosts = useMemo(() => subPostsByPost[post], [post])
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactorWithMetaData[]>([])
  useEffect(() => {
    const fetchData = async () => {
      const emissionFactors = await getEmissionsFactor()
      setEmissionFactors(emissionFactors)
    }
    fetchData()
  }, [])
  return (
    <div className={classNames(styles.subPosts, 'flex-col')}>
      {subPosts.map((subPost) => {
        const emissionSources = study.emissionSources.filter((emissionSource) => emissionSource.subPost === subPost)
        return (
          <Accordion key={subPost}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel-${subPost}-content`}
              data-testid="subpost"
            >
              <p>
                {tPost(subPost)}
                <span className={styles.count}> - {t('emissionSource', { count: emissionSources.length })}</span>
              </p>
            </AccordionSummary>
            <AccordionDetails id={`panel-${subPost}-content`}>
              {emissionSources.length > 0 && (
                <div className="mb2">
                  {emissionSources.map((emissionSource) => (
                    <EmissionSource
                      emissionSource={emissionSource}
                      key={emissionSource.id}
                      emissionFactors={emissionFactors}
                    />
                  ))}
                </div>
              )}
              <NewEmissionSource study={study} subPost={subPost} />
            </AccordionDetails>
          </Accordion>
        )
      })}
    </div>
  )
}

export default SubPosts
