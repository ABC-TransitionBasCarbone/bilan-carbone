'use server'

import Box from '@/components/base/Box'
import { getMainStudy } from '@/db/study'
import { canReadStudy } from '@/services/permissions/study'
import classNames from 'classnames'
import { User } from 'next-auth'
import Result from './Result'
import styles from './ResultsContainer.module.css'

interface Props {
  user: User
  mainStudyOrganizationId: string | null
}

const ResultsContainerForUser = async ({ user, mainStudyOrganizationId }: Props) => {
  const study = await getMainStudy(user, mainStudyOrganizationId)
  const showResults = study && (await canReadStudy(user, study))

  return showResults ? (
    <div className="pb1">
      <Box>
        <div className={classNames(styles.studyName, 'grow justify-center mb-2')}>{study.name}</div>
        <div className={classNames(styles.container)}>
          <Result study={study} by="Post" site="all" />
          <div className={styles.separator} />
          <Result study={study} by="SubPost" site="all" />
        </div>
      </Box>
    </div>
  ) : null
}

export default ResultsContainerForUser
