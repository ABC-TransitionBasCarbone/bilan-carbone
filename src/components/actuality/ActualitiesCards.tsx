'use server'

import { getMainActualities } from '@/db/actuality'
import classNames from 'classnames'
import { getTranslations } from 'next-intl/server'
import ActualityRow from './Actuality'
import NoActualities from './NoActualities'
import styles from './styles.module.css'

const ActualitiesCards = async () => {
  const actualities = await getMainActualities()
  const t = await getTranslations('actuality')
  return (
    <div>
      {actualities.length && <h4 className="mb1">{t('title')}</h4>}
      <ul className={classNames(styles.actualities, 'grid')}>
        {actualities.length ? (
          actualities.map((actuality) => <ActualityRow key={actuality.id} actuality={actuality} />)
        ) : (
          <NoActualities />
        )}
      </ul>
    </div>
  )
}

export default ActualitiesCards
