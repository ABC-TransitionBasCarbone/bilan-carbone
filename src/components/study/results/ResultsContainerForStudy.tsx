'use server'

import classNames from 'classnames'
import styles from './ResultsContainer.module.css'
import Box from '@/components/base/Box'
import { getTranslations } from 'next-intl/server'

const ResultsContainerForStudy = async () => {
  const t = await getTranslations('results')

  return (
    <div className="pb1">
      <div className={classNames(styles.container, 'flex')}>
        <Box className="grow">{t('byPost')}</Box>
        <Box className="grow">{t('bySubPost')}</Box>
      </div>
    </div>
  )
}

export default ResultsContainerForStudy
