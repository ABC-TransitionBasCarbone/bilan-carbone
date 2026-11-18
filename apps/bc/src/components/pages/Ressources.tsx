import { isTilt } from '@/services/permissions/environment'
import { getEnvironnementRessources } from '@/utils/ressources'
import Block from '@abc-transitionbascarbone/common/components/base/Block'
import Image from '@abc-transitionbascarbone/common/components/document/Image'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { customRich } from '@abc-transitionbascarbone/common/utils/customRich'
import { Alert, Card } from '@mui/material'
import classNames from 'classnames'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
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
      {isTilt(environment) && (
        <div className={classNames('gapped1', 'mt2')}>
          <div className={classNames(styles.ressources, 'gapped1', 'mt2')}>
            {ressources.map(({ title, links }) => (
              <RessourceLinks key={title} title={title} links={links} />
            ))}
          </div>
          <h2 className={styles.partnersTitle}>{t('supportTools')}</h2>
          <div className={styles.partners}>
            <Card component="article" className={styles.partnerCard}>
              <div className={styles.partnerLogo}>
                <Image
                  src="/logos/tilt/logo_tilt_noir.svg"
                  width="2511"
                  height="857"
                  alt="Logo de Mouvement Tilt"
                  className={styles.partnerLogoImage}
                />
              </div>
              <div className={styles.partnerName}>
                <Link href="https://mouvement-tilt.com/" target="_blank" rel="noreferrer noopener">
                  Mouvement Tilt
                </Link>
              </div>
            </Card>
            <Card component="article" className={styles.partnerCard}>
              <div className={styles.partnerLogo}>
                <Image
                  src="/logos/tilt/udes_noir.jpg"
                  width="2450"
                  height="868"
                  alt="Logo de l'UDES"
                  className={styles.partnerLogoImage}
                />
              </div>
              <div className={styles.partnerName}>
                <Link href="https://www.udes.fr/" target="_blank" rel="noreferrer noopener">
                  UDES
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}
      {environment === Environment.CUT && (
        <Alert severity="info" className="mt2">
          {t('france2030')}
        </Alert>
      )}
    </Block>
  )
}

export default RessourcesPage
