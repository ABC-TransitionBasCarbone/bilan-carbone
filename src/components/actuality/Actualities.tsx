import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './styles.module.css'
import Box from '../base/Box'
import NewspaperIcon from '@mui/icons-material/Newspaper'
import { Suspense } from 'react'
import ActualitiesList from './ActualitiesList'

const Actualities = () => {
  const t = useTranslations('actuality')
  return (
    <Box data-testid="home-actualities" className="grow">
      <div data-testid="actualities-title" className={classNames(styles.title, 'flex-cc pb1')}>
        <NewspaperIcon /> <h2>{t('title')}</h2>
      </div>
      <Suspense>
        <ActualitiesList />
      </Suspense>
    </Box>
  )
}

export default Actualities
