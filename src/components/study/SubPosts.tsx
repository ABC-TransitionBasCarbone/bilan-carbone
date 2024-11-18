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
import { User } from 'next-auth'
import { StudyRole } from '@prisma/client'
import { StudyWithoutDetail } from '@/services/permissions/study'

type StudyProps = {
  study: FullStudy
  withoutDetail: false
}

type StudyWithoutDetailProps = {
  study: StudyWithoutDetail
  withoutDetail: true
}

interface Props {
  post: Post
  user: User
}

const SubPosts = ({ post, study, user, withoutDetail }: Props & (StudyProps | StudyWithoutDetailProps)) => {
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

  const userRoleOnStudy = useMemo(() => {
    if (withoutDetail) {
      return null
    }
    const right = study.allowedUsers.find((right) => right.user.email === user.email)
    return right ? right.role : null
  }, [study, user, withoutDetail])

  return (
    <div className={classNames(styles.subPosts, 'flex-col')}>
      {subPosts.map((subPost) => {
        const emissionSources = study.emissionSources.filter((emissionSource) => emissionSource.subPost === subPost)
        return (!userRoleOnStudy || userRoleOnStudy === StudyRole.Reader) && emissionSources.length === 0 ? null : (
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
              {emissionSources.map((emissionSource) =>
                // Dirty hack to force type on EmissionSource
                withoutDetail ? (
                  <EmissionSource
                    study={study}
                    emissionSource={emissionSource as StudyWithoutDetail['emissionSources'][0]}
                    key={emissionSource.id}
                    emissionFactors={emissionFactors}
                    userRoleOnStudy={userRoleOnStudy}
                    withoutDetail
                  />
                ) : (
                  <EmissionSource
                    study={study}
                    emissionSource={emissionSource as FullStudy['emissionSources'][0]}
                    key={emissionSource.id}
                    emissionFactors={emissionFactors}
                    userRoleOnStudy={userRoleOnStudy}
                    withoutDetail={false}
                  />
                ),
              )}
              {!withoutDetail && userRoleOnStudy && userRoleOnStudy !== StudyRole.Reader && (
                <div className="mt2">
                  <NewEmissionSource study={study} subPost={subPost} />
                </div>
              )}
            </AccordionDetails>
          </Accordion>
        )
      })}
    </div>
  )
}

export default SubPosts
