'use server'

import classNames from 'classnames'
import styles from './styles.module.css'
import ActualityRow from './Actuality'
import NoActualities from './NoActualities'
import { getAllActualities } from '@/db/actuality'

const ActualitiesList = async () => {
  const actualities = await getAllActualities()
  return (
    <ul className={classNames(styles.actualities, 'flex-col')}>
      {actualities.length ? (
        actualities.map((actuality) => <ActualityRow key={actuality.id} actuality={actuality} />)
      ) : (
        <NoActualities />
      )}
    </ul>
  )
}

export default ActualitiesList
