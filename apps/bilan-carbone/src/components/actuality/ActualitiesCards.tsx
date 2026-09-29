'use server'

import { getMainActualitiesLocale } from '@/db/actuality.server'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import classNames from 'classnames'
import { getTranslations } from 'next-intl/server'
import ActualityRow from './Actuality'
import NoActualities from './NoActualities'
import styles from './styles.module.css'

interface Props {
  environment: Environment
}

const ActualitiesCards = async ({ environment }: Props) => {
  const actualities = await getMainActualitiesLocale(environment)
  const t = await getTranslations('actuality')
  return (
    <Block
      title={t('title')}
      data-testid="home-actualities"
      actions={[{ actionType: 'link', href: '/actualites', children: t('allActualities') }]}
    >
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
