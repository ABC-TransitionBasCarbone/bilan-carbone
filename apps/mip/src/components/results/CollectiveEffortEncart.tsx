'use client'
import { useTranslations } from 'next-intl'
import styles from './CollectiveEffortEncart.module.css'

type Actor = {
  key: 'state' | 'collectivities' | 'companies'
  color: string
  backgroundColor: string
}

const ACTORS: Actor[] = [
  { key: 'state', color: '#8b5cf6', backgroundColor: '#ede9fe' },
  { key: 'collectivities', color: '#f59e0b', backgroundColor: '#fef3c7' },
  { key: 'companies', color: '#d6006c', backgroundColor: '#fce7f3' },
]

export default function CollectiveEffortEncart() {
  const t = useTranslations('results.collectiveEffort')

  return (
    <div className={styles.encart}>
      <p className={styles.title}>{t('title')}</p>
      <div className={styles.grid}>
        {ACTORS.map(({ key, color, backgroundColor }) => (
          <div key={key} className={styles.column}>
            <span className={styles.badge} style={{ color, backgroundColor }}>
              {t(`${key}.label` as Parameters<typeof t>[0])}
            </span>
            <p
              className={styles.description}
              dangerouslySetInnerHTML={{ __html: t.raw(`${key}.description` as Parameters<typeof t>[0]) as string }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
