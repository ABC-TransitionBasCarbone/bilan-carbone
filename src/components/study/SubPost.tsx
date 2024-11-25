import styles from './SubPosts.module.css'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { FullStudy } from '@/db/study'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import { StudyRole, SubPost as SubPostEnum } from '@prisma/client'
import EmissionSource from './EmissionSource'
import NewEmissionSource from './NewEmissionSource'
import { useTranslations } from 'next-intl'
import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import { useMemo } from 'react'

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
}

const SubPost = ({
  subPost,
  withoutDetail,
  study,
  userRoleOnStudy,
  emissionFactors,
}: Props & (StudyProps | StudyWithoutDetailProps)) => {
  const tPost = useTranslations('emissionFactors.post')
  const t = useTranslations('study.post')

  const emissionSources = useMemo(
    () => study.emissionSources.filter((emissionSource) => emissionSource.subPost === subPost),
    [study, subPost],
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

  return (!userRoleOnStudy || userRoleOnStudy === StudyRole.Reader) && emissionSources.length === 0 ? null : (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`panel-${subPost}-content`}
        data-testid="subpost"
      >
        <p>
          {tPost(subPost)}
          <span className={styles.count}> - {t('emissionSource', { count: emissionSources.length })}</span>
          {contributors && contributors.length > 0 && (
            <span className={styles.count}> - {t('contributors', { count: contributors.length })}</span>
          )}
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
}

export default SubPost
