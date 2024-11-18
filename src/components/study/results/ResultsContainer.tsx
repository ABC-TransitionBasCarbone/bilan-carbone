'use server'

import classNames from 'classnames'
import styles from './ResultsContainer.module.css'
import Box from '@/components/base/Box'
import { getTranslations } from 'next-intl/server'
import { User } from 'next-auth'
import { getMainStudy } from '@/db/study'
import { canReadStudy } from '@/services/permissions/study'

interface Props {
  user: User
}

const ResultsContainer = async ({ user }: Props) => {
  const t = await getTranslations('results')
  const study = await getMainStudy(user)
  const showResults = study && (await canReadStudy(user, study))

  return showResults ? (
    <div className="pb1">
      <div className={classNames(styles.container, 'flex')}>
        <Box className="grow">{t('byPost')}</Box>
        <Box className="grow">{t('bySubPost')}</Box>
      </div>
    </div>
  ) : null
}

export default ResultsContainer
