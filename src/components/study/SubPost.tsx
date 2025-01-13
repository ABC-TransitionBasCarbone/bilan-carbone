import { FullStudy } from '@/db/study'
import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import { caracterisationsBySubPost } from '@/services/emissionSource'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { Post } from '@/services/posts'
import { downloadStudySubPosts } from '@/services/study'
import DownloadIcon from '@mui/icons-material/Download'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import { StudyRole, SubPost as SubPostEnum } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import Button from '../base/Button'
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
  post: Post
  subPost: SubPostEnum
  userRoleOnStudy: StudyRole | null
  emissionFactors: EmissionFactorWithMetaData[]
  emissionSources: FullStudy['emissionSources']
  site: string
}

const SubPost = ({
  post,
  subPost,
  withoutDetail,
  study,
  userRoleOnStudy,
  emissionFactors,
  emissionSources,
  site,
}: Props & (StudyProps | StudyWithoutDetailProps)) => {
  const t = useTranslations('study.post')
  const tExport = useTranslations('study.export')
  const tCaracterisations = useTranslations('categorisations')
  const tPost = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')
  const tUnit = useTranslations('units')

  const subPostEmissionFactors = useMemo(() => {
    return emissionFactors.filter((emissionFactor) => emissionFactor.subPosts.includes(subPost))
  }, [emissionFactors, subPost])

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
    <div className="flex">
      <Accordion className="grow">
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
              <NewEmissionSource study={study} subPost={subPost} caracterisations={caracterisations} site={site} />
            </div>
          )}
        </AccordionDetails>
      </Accordion>
      {!withoutDetail && (
        <div className={classNames(styles.download, 'flex ml1')}>
          <Button
            aria-label={tExport('downloadSubPost', { name: subPost })}
            title={tExport('downloadSubPost', { name: subPost })}
            onClick={() => {
              downloadStudySubPosts(
                study as FullStudy,
                post,
                subPost,
                emissionSources,
                subPostEmissionFactors,
                tExport,
                tCaracterisations,
                tPost,
                tQuality,
                tUnit,
              )
            }}
            disabled={emissionSources.length === 0}
          >
            <DownloadIcon />
          </Button>
        </div>
      )}
    </div>
  )
}

export default SubPost
