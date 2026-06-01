import Button from '../Button/Button'
import styles from './MosaicNumberInput.module.css'

type Props = {
  title?: string
  icons?: string
  description?: string
  onChange: (value: number) => void
  value?: number
}

export default function MosaicNumberInput({ title, icons, description, onChange, value, ...props }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.info}>
        {title && icons ? (
          <span className={styles.title}>
            {title}&nbsp;{icons}
          </span>
        ) : null}
        {description ? <p className={styles.description}>{description.split('\n')[0]}</p> : null}
      </div>
      <div className={styles.controls}>
        <Button disabled={value === 0} onClick={() => onChange(Number(value) - 1)} className={styles.button}>
          <span>-</span>
        </Button>
        <input
          className={styles.input}
          type="number"
          inputMode="numeric"
          value={value ? Number(value) : ''}
          placeholder="0"
          onChange={(event) => onChange(Number(event.target.value))}
          {...props}
        />
        <Button onClick={() => onChange(value ? Number(value) + 1 : 1)} className={styles.button}>
          <span>+</span>
        </Button>
      </div>
    </div>
  )
}
