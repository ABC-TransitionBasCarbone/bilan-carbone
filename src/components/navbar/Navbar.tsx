import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { Role } from '@prisma/client'
import classNames from 'classnames'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import styles from './Navbar.module.css'

interface Props {
  user: User
}

const Navbar = ({ user }: Props) => {
  const t = useTranslations('navigation')

  return (
    <nav className={classNames(styles.navbar, 'w100')}>
      <div className="main-container px-2 align-center justify-between grow h100">
        <div className={classNames(styles.navbarContainer, 'flex-cc')}>
          <Link href="/" aria-label={t('home')} title={t('home')}>
            <Image src="/logos/bcp-with-text.png" width={200} height={48} alt="" className={styles.logo} />
          </Link>
          <Link className={styles.link} href="/facteurs-d-emission">
            <span className={styles.big}>{t('factors')}</span>
            <span className={styles.small}>{t('fe')}</span>
          </Link>
          <Link className={styles.link} href="/organisations">
            {t('organization')}
          </Link>
          <Link className={styles.link} href="/equipe">
            {t('team')}
          </Link>
          <Link className={styles.link} href="/transition">
            {t('transition')}
          </Link>
        </div>

        <div className={classNames(styles.navbarContainer, 'flex-cc')}>
          {user.role === Role.SUPER_ADMIN && (
            <Link className={styles.link} href="/super-admin">
              {t('admin')}
            </Link>
          )}
          <Link
            target="_blank"
            rel="noreferrer noopener"
            href={`mailto:${process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL}`}
            className={classNames(styles.link, 'align-center')}
            aria-label={t('help')}
          >
            <HelpOutlineIcon />
            <span className={styles.big}>{t('help')}</span>
          </Link>
          <Link className={classNames(styles.link, 'align-center')} aria-label={t('profile')} href="/profil">
            <AccountCircleIcon />
            <span className={styles.big}>{t('profile')}</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
