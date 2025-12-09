'use client'

import { FullStudy } from '@/db/study'
import { getCaracterisationsBySubPost, getEmissionResults } from '@/services/emissionSource'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { Post } from '@/services/posts'
import { EmissionFactorWithMetaData, getEmissionFactors } from '@/services/serverFunctions/emissionFactor'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { formatNumber } from '@/utils/number'
import { withInfobulle } from '@/utils/post'
import { postColors, STUDY_UNIT_VALUES } from '@/utils/study'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import { Environment, Import, StudyRole, SubPost as SubPostEnum } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import HelpIcon from '../base/HelpIcon'
import EmissionSource from './EmissionSource'
import NewEmissionSource from './NewEmissionSource'
import styles from './SubPosts.module.css'

type StudyProps = {
  study: FullStudy
  withoutDetail: false
  hasFilter: boolean
}

type StudyWithoutDetailProps = {
  study: StudyWithoutDetail
  withoutDetail: true
  hasFilter: boolean
}

interface Props {
  post: Post
  subPost: SubPostEnum
  userRoleOnStudy: StudyRole | null
  emissionSources: FullStudy['emissionSources']
  studySite: string
  setGlossary: (subPost: string) => void
  count: number
  validated: number
}

const SubPost = ({
  post,
  subPost,
  withoutDetail,
  study,
  userRoleOnStudy,
  emissionSources,
  studySite,
  setGlossary,
  count,
  validated,
  hasFilter,
}: Props & (StudyProps | StudyWithoutDetailProps)) => {
  const t = useTranslations('study.post')
  const tStudy = useTranslations('study')
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')
  const { environment } = useAppEnvironmentStore()
  const [emissionFactorsForSubPost, setEmissionFactorsForSubPost] = useState<EmissionFactorWithMetaData[]>([])
  const [expanded, setExpanded] = useState(false)
  const importVersions = useMemo(
    () => [
      { id: Import.Manual, source: Import.Manual, name: '' },
      ...study.emissionFactorVersions.map((efv) => efv.importVersion),
    ],
    [study.emissionFactorVersions],
  )

  useEffect(() => {
    async function fetchEmissionFactors() {
      const emissionsFactors = await getEmissionFactors(
        0,
        'ALL',
        {
          archived: false,
          search: '',
          location: '',
          sources: importVersions.map((iv) => iv.id),
          units: ['all'],
          subPosts: [subPost],
        },
        environment as Environment,
        study.id,
      )

      if (emissionsFactors.success) {
        setEmissionFactorsForSubPost(emissionsFactors.data.emissionFactors)
      }
    }

    if (emissionFactorsForSubPost.length === 0 && expanded) {
      fetchEmissionFactors()
    }
  }, [emissionFactorsForSubPost.length, environment, expanded, importVersions, study.id, subPost])

  useEffect(() => {
    if (hasFilter && emissionSources.length) {
      setExpanded(true)
    }
  }, [emissionSources.length, hasFilter])

  const total = useMemo(() => {
    if (!environment) {
      return 0
    }

    return emissionSources.reduce(
      (sum, emissionSource) => sum + (getEmissionResults(emissionSource, environment)?.emissionValue || 0),
      0,
    )
  }, [emissionSources, environment])

  const contributors = useMemo(
    () =>
      withoutDetail
        ? null
        : study.contributors
            .filter((contributor) => contributor.subPost === subPost)
            .map((contributor) => contributor.account.user.email),
    [study, subPost, withoutDetail],
  )

  const caracterisations = useMemo(
    () => getCaracterisationsBySubPost(subPost, study.exports, environment),
    [subPost, study.exports, environment],
  )

  const accordionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hash = window.location.hash

    if (hash === `#subpost-${subPost}`) {
      setExpanded(true)
      setTimeout(() => {
        accordionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    } else if (hash.startsWith('#emission-source-')) {
      const emissionSourceId = hash.replace('#emission-source-', '')
      const hasTargetEmissionSource = emissionSources.some((source) => source.id === emissionSourceId)

      if (hasTargetEmissionSource) {
        setExpanded(true)
      }
    }
  }, [emissionSources, subPost])

  return (!userRoleOnStudy || userRoleOnStudy === StudyRole.Reader) && emissionSources.length === 0 ? null : (
    <div ref={accordionRef} id={`subpost-${subPost}`} className={styles.subPostScrollContainer}>
      <Accordion expanded={expanded} onChange={(_, isExpanded) => setExpanded(isExpanded)} className={styles.accordion}>
        <AccordionSummary
          className={classNames(styles.subPostContainer, styles[`post-${postColors[post]}`], {
            [styles.open]: expanded,
          })}
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel-${subPost}-content`}
          data-testid="subpost"
        >
          <p>
            {tPost(subPost)}
            {withInfobulle(subPost) && (
              <HelpIcon
                className={classNames(styles.helpIcon, 'ml-4')}
                onClick={(e) => {
                  e.stopPropagation()
                  setGlossary(subPost)
                }}
                label={tPost('glossary')}
              />
            )}
            <span className={classNames(styles.value, 'ml1')}>
              {formatNumber(total / STUDY_UNIT_VALUES[study.resultsUnit])} {tUnits(study.resultsUnit)}
            </span>
            {contributors && contributors.length > 0 && (
              <span className={classNames(styles.contributors, 'ml1')}>
                {t('contributorsList', { count: contributors.length })} {contributors.join(', ')}
              </span>
            )}
          </p>
          {count > 0 && (
            <span className="grow justify-end mr1">
              {tStudy.rich('validatedSources', { total: count, validated, data: (children) => <>{children}</> })}
            </span>
          )}
        </AccordionSummary>
        <AccordionDetails id={`panel-${subPost}-content`} className={styles.subPostDetailsContainer}>
          {emissionSources.map((emissionSource) =>
            // Dirty hack to force type on EmissionSource
            withoutDetail ? (
              <EmissionSource
                study={study}
                emissionSource={emissionSource}
                key={emissionSource.id}
                subPost={subPost}
                userRoleOnStudy={userRoleOnStudy}
                withoutDetail
                caracterisations={caracterisations}
                emissionFactorsForSubPost={emissionFactorsForSubPost}
                importVersions={importVersions}
              />
            ) : (
              <EmissionSource
                study={study}
                emissionSource={emissionSource}
                key={emissionSource.id}
                subPost={subPost}
                userRoleOnStudy={userRoleOnStudy}
                withoutDetail={false}
                caracterisations={caracterisations}
                emissionFactorsForSubPost={emissionFactorsForSubPost}
                importVersions={importVersions}
              />
            ),
          )}
          {!withoutDetail && userRoleOnStudy && userRoleOnStudy !== StudyRole.Reader && (
            <div className="mt2">
              <NewEmissionSource
                study={study}
                subPost={subPost}
                caracterisations={caracterisations}
                studySite={studySite}
              />
            </div>
          )}
        </AccordionDetails>
      </Accordion>
    </div>
  )
}

export default SubPost
