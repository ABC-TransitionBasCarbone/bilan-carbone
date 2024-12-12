import { auth } from '@/services/auth'
import { canAccessAdmin } from '@/services/permissions/user'
import classNames from 'classnames'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import styles from './Navbar.module.css'

const Navbar = async () => {
  const t = await getTranslations('navigation')

  const canAccessAdminLink = async () => {
    'use server'
    const session = await auth()
    if (!session) {
      return false
    }
    return canAccessAdmin(session.user)
  }

  return (
    <nav className={classNames(styles.navbar, 'w100')}>
      <div className="main-container px-2 align-center justify-between grow h100">
        <div className={classNames(styles.navbarContainer, 'flex-cc')}>
          <Link href="/" aria-label={t('home')}>
            <Image src="/logos/bcp-with-text.png" width={200} height={48} alt="" className={styles.logo} />
          </Link>
          <Link className={styles.link} href="/facteurs-d-emission">
            {t('factors')}
          </Link>
          <Link className={styles.link} href="/organisations">
            {t('organization')}
          </Link>
          <Link className={styles.link} href="/equipe">
            {t('team')}
          </Link>
        </div>

        <div className={classNames(styles.navbarContainer, 'flex-cc')}>
          {(await canAccessAdminLink()) && (
            <Link className={styles.link} href="/admin">
              {t('admin')}
            </Link>
          )}
          <Link
            target="_blank"
            rel="noreferrer noopener"
            className={styles.link}
            href={`mailto:${process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL}`}
          >
            <span>{t('help')}</span>
          </Link>
          <Link className={styles.link} href="/profil">
            {t('profile')}
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
