'use server'

import { getAllActualitiesLocale } from '@/db/actuality.server'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import classNames from 'classnames'
import ActualityRow from './Actuality'
import NoActualities from './NoActualities'
import styles from './styles.module.css'

interface Props {
  environment: Environment
}

const ActualitiesList = async ({ environment }: Props) => {
  const actualities = await getAllActualitiesLocale(environment)
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
