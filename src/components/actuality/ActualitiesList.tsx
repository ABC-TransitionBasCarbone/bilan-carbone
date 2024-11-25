'use server'

import { getAllActualities } from '@/db/actuality'
import classNames from 'classnames'
import ActualityRow from './Actuality'
import NoActualities from './NoActualities'
import styles from './styles.module.css'

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
