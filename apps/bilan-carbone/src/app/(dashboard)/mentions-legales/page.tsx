import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { getEnvVar } from '@abc-transitionbascarbone/lib/environment'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import styles from './styles.module.css'

const LegalNotices = async () => {
  const contactMail = await getEnvVar('CONTACT_EMAIL', Environment.BC)
  const t = await getTranslations('legalNotices')
  return (
    <Block>
      <div className={styles.notices} data-testid="legal-notices">
        <div className="mb1">
          <Link data-testid="profile-link" href="/profil">
            {t('profile')}
          </Link>
        </div>

        <p>{t('introduction')}</p>

        <h1 className={styles.section}>{t('publisher.title')}</h1>
        <p className="flex-col">
          <span>{t('publisher.type')}</span>
          <span>{t('publisher.siret')}</span>
          <span>{t('publisher.office')}</span>
          <span>{t('publisher.phone')}</span>
          <span>
            {t('publisher.mail')}{' '}
            <a data-testid="contact-mail" href={`mailto:${contactMail}`}>
              {contactMail}
            </a>
          </span>
          <span>{t('publisher.vat')}</span>
        </p>

        <div className={styles.section}>{t('provider.title')}</div>
        <p>{t('provider.details')}</p>

        <div className={styles.section}>{t('websiteOwner.title')}</div>
        <p>{t('websiteOwner.description')}</p>
        <p>{t('websiteOwner.editorInChief')}</p>

        <div className={styles.section}>{t('intellectualProperty.title')}</div>
        <p>{t('intellectualProperty.description1')}</p>
        <p>{t('intellectualProperty.description2')}</p>

        <div className={styles.section}>{t('hypertextLinks.title')}</div>
        <p>{t('hypertextLinks.description')}</p>

        <div className={styles.section}>{t('accessRights.title')}</div>
        <p>{t('accessRights.description')}</p>

        <div className={styles.section}>{t('trademark.title')}</div>
        <p>{t('trademark.description1')}</p>
      </div>
    </Block>
  )
}

export default LegalNotices
