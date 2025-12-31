import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './ExportCheckbox.module.css'

const GHGPGlossaryModal = () => {
  const t = useTranslations('exports.glossary.GHGP')

  return (
    <div className="flex-col">
      <span className="mb1">{t('warning')}</span>
      <ul className={classNames(styles.list, 'mb1')}>
        <li>{t('item1')}</li>
        <li>{t('item2')}</li>
        <li className={styles.subList}>
          {t.rich('item3', {
            green: (children) => <span style={{ color: 'green' }}>{children}</span>,
            purple: (children) => <span style={{ color: 'purple' }}>{children}</span>,
            ul: (children) => <ul>{children}</ul>,
            li: (children) => <li>{children}</li>,
          })}
        </li>
      </ul>

      <span>{t('conclusion')}</span>
    </div>
  )
}

export default GHGPGlossaryModal
