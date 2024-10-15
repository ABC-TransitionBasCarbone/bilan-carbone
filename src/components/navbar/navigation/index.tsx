'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import styles from './styles.module.css'
import Button from '@/components/button'
import Icon, { ICON_TYPE } from '@/components/icon'

const Navigation = () => {
  const router = useRouter()
  const t = useTranslations('navigation')

  const redirect = (target: string) => router.push(`/${target}`)

  return (
    <div className={styles.navRouter}>
      <Button onClick={() => redirect('')}>
        <Icon icon={ICON_TYPE.HOME} />
      </Button>
      <Button onClick={() => redirect('facteurs')}>
        <span>{t('factors')}</span>
      </Button>
      <Button onClick={() => redirect('equipe')}>
        <span>{t('team')}</span>
      </Button>
    </div>
  )
}

export default Navigation
