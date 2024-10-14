'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import styles from './styles.module.css'
import Button from '@/components/button'
import Icon, { ICON_TYPE } from '@/components/icon'
import LocaleSelector from './LocaleSelector'

const Settings = () => {
  const router = useRouter()
  const t = useTranslations('navigation')

  const goToProfile = () => router.push('/profile')

  const askSupport = (): void => {
    window.location.href = 'mailto:support@abc-transitionbascarbone.fr'
  }

  return (
    <div className={styles.navSettings}>
      <LocaleSelector />
      <Button onClick={askSupport}>
        <span>{t('help')}</span>
      </Button>
      <Button onClick={goToProfile} className="flex-cc">
        <Icon icon={ICON_TYPE.USER} />
      </Button>
    </div>
  )
}

export default Settings
