import LinkButton from '@/components/base/LinkButton'
import { FullStudy } from '@/db/study'
import Leaf from '@mui/icons-material/Spa'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Result from './Result'
import styles from './ResultsContainer.module.css'

interface Props {
  study: FullStudy
  studySite: string
  showTitle?: boolean
  withDependencies?: boolean
}

const StudyResultsContainerSummary = ({ study, studySite, showTitle, withDependencies }: Props) => {
  const t = useTranslations('study')
  return (
    <>
      {withDependencies === undefined && showTitle && (
        <div className="justify-between mb1">
          <div className={classNames(styles.studyName, 'align-center')}>
            <Link className={classNames(styles.studyName, 'align-center')} href={`/etudes/${study.id}`}>
              <Leaf />
              {study.name}
            </Link>
          </div>
          <LinkButton href={`/etudes/${study.id}/comptabilisation/resultats`}>{t('seeResults')}</LinkButton>
        </div>
      )}
      <div className={styles.container}>
        <div className={styles.graph}>
          <Result study={study} by="Post" studySite={studySite} withDependenciesGlobal={withDependencies} />
        </div>
        <div className={styles.separatorContainer}>
          <div className={styles.separator} />
        </div>
        <div className={styles.graph}>
          <Result study={study} by="SubPost" studySite={studySite} withDependenciesGlobal={withDependencies} />
        </div>
      </div>
    </>
  )
}

export default StudyResultsContainerSummary
