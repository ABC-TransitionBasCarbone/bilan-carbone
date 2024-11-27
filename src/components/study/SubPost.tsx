import { FullStudy } from '@/db/study'
import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
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
}

const SubPost = ({
  post,
  subPost,
  withoutDetail,
  study,
  userRoleOnStudy,
  emissionFactors,
}: Props & (StudyProps | StudyWithoutDetailProps)) => {
  const t = useTranslations('study.post')
  const tExport = useTranslations('study.export')
  const tPost = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')

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
      {!withoutDetail && (
        <div className={classNames(styles.download, 'flex ml1')}>
          <Button
            aria-label={tExport('downloadSubPost', { name: subPost })}
            onClick={() => {
              downloadStudySubPosts(
                study as FullStudy,
                post,
                subPost,
                emissionSources as FullStudy['emissionSources'],
                emissionFactors,
                tExport,
                tPost,
                tQuality,
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
