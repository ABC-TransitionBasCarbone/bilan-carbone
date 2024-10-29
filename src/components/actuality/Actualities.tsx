import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Actuality } from '@prisma/client'
import styles from './styles.module.css'
import ActualityRow from './Actuality'
import Box from '../base/Box'
import NewspaperIcon from '@mui/icons-material/Newspaper'

interface Props {
  actualities: Actuality[]
}

const Actualities = ({ actualities }: Props) => {
  const t = useTranslations('actuality')
  const sortedActualities = actualities.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  return (
    <Box data-testid="home-actualities" className="grow">
      <div data-testid="actualities-title" className={classNames(styles.title, 'flex-cc pb1')}>
        <NewspaperIcon /> <h2>{t('title')}</h2>
      </div>
      <ul className={classNames(styles.actualities, 'flex-col')}>
        {actualities.length ? (
          sortedActualities.map((actuality) => <ActualityRow key={actuality.id} actuality={actuality} />)
        ) : (
          <>{t('no-item')}</>
        )}
      </ul>
    </Box>
  )
}

export default Actualities
