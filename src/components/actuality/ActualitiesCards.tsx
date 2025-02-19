'use server'

import { getMainActualities } from '@/db/actuality'
import classNames from 'classnames'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import ActualityRow from './Actuality'
import NoActualities from './NoActualities'
import styles from './styles.module.css'

const ActualitiesCards = async () => {
  const actualities = await getMainActualities()
  const t = await getTranslations('actuality')
  return (
    <Block title={t('title')} data-testid="home-actualities">
      <ul className={classNames(styles.actualities, 'grid')}>
        {actualities.length ? (
          actualities.map((actuality) => <ActualityRow key={actuality.id} actuality={actuality} />)
        ) : (
          <NoActualities />
        )}
      </ul>
    </Block>
  )
}

export default ActualitiesCards
