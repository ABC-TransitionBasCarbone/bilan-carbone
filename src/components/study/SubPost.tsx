import { FullStudy } from '@/db/study'
import { caracterisationsBySubPost, getEmissionResults } from '@/services/emissionSource'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { formatNumber } from '@/utils/number'
import { withInfobulle } from '@/utils/post'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import { StudyRole, SubPost as SubPostEnum } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
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
  const tUnit = useTranslations('results')

  const subPostEmissionFactors = useMemo(
    () => emissionFactors.filter((emissionFactor) => emissionFactor.subPosts.includes(subPost)),
    [emissionFactors, subPost],
  )

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
            .map((contributor) => contributor.user.email),
    [study, subPost, withoutDetail],
  )

  const caracterisations = useMemo(() => caracterisationsBySubPost[subPost], [subPost])
  return (!userRoleOnStudy || userRoleOnStudy === StudyRole.Reader) && emissionSources.length === 0 ? null : (
    <div>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel-${subPost}-content`}
          data-testid="subpost"
        >
          <p>
            {tPost(subPost)}
            {withInfobulle.includes(subPost) && (
              <HelpIcon
                onClick={(e) => {
                  e.stopPropagation()
                  setGlossary(subPost)
                }}
                label={tPost('glossary')}
              />
            )}
            <span className={classNames(styles.value, 'ml1')}>
              {formatNumber(total / 1000)} {tUnit('unit')}
            </span>
          </p>
        </AccordionSummary>
        <AccordionDetails id={`panel-${subPost}-content`}>
          {contributors && contributors.length > 0 && (
            <p className={styles.contributors}>
              {t('contributorsList', { count: contributors.length })} {contributors.join(', ')}
            </p>
          )}
          {emissionSources.map((emissionSource) =>
            // Dirty hack to force type on EmissionSource
            withoutDetail ? (
              <EmissionSource
                study={study}
                emissionSource={emissionSource}
                key={emissionSource.id}
                emissionFactors={subPostEmissionFactors}
                userRoleOnStudy={userRoleOnStudy}
                withoutDetail
                caracterisations={caracterisations}
              />
            ) : (
              <EmissionSource
                study={study}
                emissionSource={emissionSource}
                key={emissionSource.id}
                emissionFactors={subPostEmissionFactors}
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
