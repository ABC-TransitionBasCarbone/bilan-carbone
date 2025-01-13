import NewspaperIcon from '@mui/icons-material/Newspaper'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import Box from '../base/Box'
import ActualitiesList from './ActualitiesList'
import styles from './styles.module.css'

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
