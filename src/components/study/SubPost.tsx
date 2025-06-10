'use client'

import { FullStudy } from '@/db/study'
import { caracterisationsBySubPost, getEmissionResults } from '@/services/emissionSource'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { formatNumber } from '@/utils/number'
import { withInfobulle } from '@/utils/post'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import { StudyRole, SubPost as SubPostEnum } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import HelpIcon from '../base/HelpIcon'
import EmissionSource from './EmissionSource'
import NewEmissionSource from './NewEmissionSource'
import styles from './SubPosts.module.css'

type StudyProps = {
  study: FullStudy
  withoutDetail: false
}

type StudyWithoutDetailProps = {
  study: StudyWithoutDetail
  withoutDetail: true
}

interface Props {
  subPost: SubPostEnum
  userRoleOnStudy: StudyRole | null
  emissionFactors: EmissionFactorWithMetaData[]
  emissionSources: FullStudy['emissionSources']
  studySite: string
  setGlossary: (subPost: string) => void
}

const SubPost = ({
  subPost,
  withoutDetail,
  study,
  userRoleOnStudy,
  emissionFactors,
  emissionSources,
  studySite,
  setGlossary,
}: Props & (StudyProps | StudyWithoutDetailProps)) => {
  const t = useTranslations('study.post')
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')

  const total = useMemo(
    () => emissionSources.reduce((sum, emissionSource) => sum + (getEmissionResults(emissionSource)?.emission || 0), 0),
    [emissionSources],
  )

  const contributors = useMemo(
    () =>
      withoutDetail
        ? null
        : study.contributors
            .filter((contributor) => contributor.subPost === subPost)
            .map((contributor) => contributor.account.user.email),
    [study, subPost, withoutDetail],
  )

  const caracterisations = useMemo(() => caracterisationsBySubPost[subPost], [subPost])

  const [expanded, setExpanded] = useState(false)

  // Check if any emission source in this subpost should be opened by URL hash
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#emission-source-')) {
      const emissionSourceId = hash.replace('#emission-source-', '')
      const hasTargetEmissionSource = emissionSources.some((source) => source.id === emissionSourceId)

      if (hasTargetEmissionSource) {
        setExpanded(true)
        setTimeout(() => {
          const element = document.getElementById(hash.substring(1))
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 600) // Delay to ensure both accordion and emission source are expanded
      }
    }
  }, [emissionSources])

  return (!userRoleOnStudy || userRoleOnStudy === StudyRole.Reader) && emissionSources.length === 0 ? null : (
    <div>
      <Accordion expanded={expanded} onChange={(_, isExpanded) => setExpanded(isExpanded)}>
        <AccordionSummary
          className={styles.subPostContainer}
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel-${subPost}-content`}
          data-testid="subpost"
        >
          <p>
            {tPost(subPost)}
            {withInfobulle(subPost) && (
              <HelpIcon
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
              <span className={styles.contributors}>
                {t('contributorsList', { count: contributors.length })} {contributors.join(', ')}
              </span>
            )}
          </p>
        </AccordionSummary>
        <AccordionDetails id={`panel-${subPost}-content`} className={styles.subPostDetailsContainer}>
          {emissionSources.map((emissionSource) =>
            // Dirty hack to force type on EmissionSource
            withoutDetail ? (
              <EmissionSource
                study={study}
                emissionSource={emissionSource}
                key={emissionSource.id}
                emissionFactors={emissionFactors}
                subPost={subPost}
                userRoleOnStudy={userRoleOnStudy}
                withoutDetail
                caracterisations={caracterisations}
              />
            ) : (
              <EmissionSource
                study={study}
                emissionSource={emissionSource}
                key={emissionSource.id}
                emissionFactors={emissionFactors}
                subPost={subPost}
                userRoleOnStudy={userRoleOnStudy}
                withoutDetail={false}
                caracterisations={caracterisations}
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
