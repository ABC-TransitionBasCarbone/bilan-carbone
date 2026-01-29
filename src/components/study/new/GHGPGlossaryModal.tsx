import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './ExportCheckbox.module.css'
import { customRich } from '@/i18n/customRich'

const GHGPGlossaryModal = () => {
  const t = useTranslations('exports.glossary.GHGP')

  return (
    <div className="flex-col">
      <span className="mb1">{t('warning')}</span>
      <ul className={classNames(styles.list, 'mb1')}>
        <li>{customRich(t,'item1')}</li>
        <li>{customRich(t,'item2')}</li>
        <li className={styles.subList}>
          {customRich(t,'item3')}
        </li>
        <li>{customRich(t,'item4')}</li>
      </ul>
      <span>{customRich(t,'conclusion')}</span>
    </div>
  )
}

export default GHGPGlossaryModal
