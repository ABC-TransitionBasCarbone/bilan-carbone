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
      <h2 data-testid="actualities-title" className={classNames(styles.title, 'align-center pb1')}>
        <NewspaperIcon /> {t('title')}
      </h2>
      {actualities.length ? (
        sortedActualities.map((a) => <ActualityRow key={a.id} actuality={a} />)
      ) : (
        <>{t('no-item')}</>
      )}
    </Box>
  )
}

export default Actualities
