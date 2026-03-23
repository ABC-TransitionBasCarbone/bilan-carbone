'use server'

import { customRich } from '@/i18n/customRich'
import { getEnvironnementRessources } from '@/utils/ressources'
import { Alert } from '@mui/material'
import { Environment } from '@repo/db-common/enums'
import classNames from 'classnames'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import RessourceLinks from '../ressources/RessourceLinks'
import styles from './Ressources.module.css'

interface Props {
  environment: Environment
}

const RessourcesPage = async ({ environment }: Props) => {
  const t = await getTranslations('ressources')

  const ressources = await getEnvironnementRessources(environment, t)

  return (
    <Block title={t('title')} as="h1">
      {environment === Environment.CUT && (
        <Alert severity="info" className="mb2">
          {customRich(t, 'description')}
        </Alert>
      )}
      <div className={classNames(styles.ressources, 'gapped1')}>
        {ressources.map(({ title, links }) => (
          <RessourceLinks key={title} title={title} links={links} />
        ))}
      </div>
      {environment === Environment.CUT && (
        <Alert severity="info" className="mt2">
          {t('france2030')}
        </Alert>
      )}
    </Block>
  )
}

export default RessourcesPage
