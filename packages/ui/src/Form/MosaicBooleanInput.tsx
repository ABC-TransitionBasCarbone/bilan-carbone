import styles from './MosaicBooleanInput.module.css'

type Props = {
  title?: string
  icons?: string
  description?: string
  value?: boolean
  isInactive?: boolean
  onChange: (value: boolean) => void
  index: number
}

export default function MosaicBooleanInput({ title, icons, description, value, isInactive, onChange, index }: Props) {
  const status = isInactive ? 'inactive' : value ? 'checked' : 'unchecked'

  return (
    <div className={styles.wrapper}>
      <label className={`${styles.label} ${styles[status]}`} htmlFor={`mosaic-boolean-${index}`}>
        <input
          type="checkbox"
          disabled={isInactive}
          className={styles.hiddenInput}
          onClick={() => onChange(!value)}
          id={`mosaic-boolean-${index}`}
        />
        <span className={`${styles.check} ${styles[`check_${status}`]}`}>
          {status === 'checked' ? <span className={styles.checkmark}>✓</span> : ''}
        </span>
        <div className={styles.content}>
          {title ? (
            <span className={`${styles.title} ${styles[`title_${status}`]}`}>
              {title}
              {icons ? <> {icons}</> : null}
            </span>
          ) : null}
          {description ? <p className={styles.description}>{description.split('\n')[0]}</p> : null}
        </div>
      </label>
    </div>
  )
}
