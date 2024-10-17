import classNames from 'classnames'
import { Actuality } from '@prisma/client'
import styles from './styles.module.css'
import ActualityRow from './Actuality'
import NewspaperIcon from '@mui/icons-material/Newspaper'

interface Props {
  actualities: Actuality[]
}

const Actualities = ({ actualities }: Props) => {
  const sortedActualities = actualities.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  return (
    <div className="grow p1">
      <h2 className={classNames(styles.title, 'align-center pb1')}>
        <NewspaperIcon /> Mes actualités
      </h2>
      {actualities.length === 0 ? <>Aucunes actualités pour le moment</> : sortedActualities.map(ActualityRow)}
    </div>
  )
}

export default Actualities
