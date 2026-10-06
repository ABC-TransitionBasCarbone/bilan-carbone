'use server'

import { getMainActualitiesLocale } from '@/db/actuality.server'
import Block from '@abc-transitionbascarbone/common/components/base/Block'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import classNames from 'classnames'
import { getTranslations } from 'next-intl/server'
import ActualityRow from './Actuality'
import styles from './styles.module.css'

interface Props {
  environment: Environment
}

const ActualitiesCards = async ({ environment }: Props) => {
  const actualities = await getMainActualitiesLocale(environment)
  const t = await getTranslations('actuality')

  if (!actualities.length) {
    return null
  }

  return (
    <Block
      title={t('title')}
      data-testid="home-actualities"
      actions={[{ actionType: 'link', href: '/actualites', children: t('allActualities') }]}
    >
      <ul className={classNames(styles.actualities, 'grid')}>
        {actualities.map((actuality) => (
          <ActualityRow key={actuality.id} actuality={actuality} />
        ))}
      </ul>
    </Block>
  )
}

export default ActualitiesCards
