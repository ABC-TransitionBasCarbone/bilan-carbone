'use server'

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
      <div className={classNames(styles.container, 'wrap')}>
        <Result study={study} by="Post" site="all" />
        <Result study={study} by="SubPost" site="all" />
      </div>
    </div>
  ) : null
}

export default ResultsContainerForUser
