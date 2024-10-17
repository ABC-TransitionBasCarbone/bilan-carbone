import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Actuality } from '@prisma/client'
import styles from './styles.module.css'
import ActualityRow from './Actuality'
import NewspaperIcon from '@mui/icons-material/Newspaper'

interface Props {
  actualities: Actuality[]
}

const Actualities = ({ actualities }: Props) => {
  const t = useTranslations('actuality')
  const sortedActualities = actualities.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  return (
    <div className="grow box m-2">
      <h2 className={classNames(styles.title, 'align-center pb1')}>
        <NewspaperIcon /> {t('title')}
      </h2>
      {actualities.length === 0 ? <>{t('no-item')}</> : sortedActualities.map(ActualityRow)}
    </div>
  )
}

export default Actualities
