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
  const rounded = value != null ? Math.ceil(value) : undefined

  return (
    <div className={`${styles.element} p125`}>
      <div className="justify-between align-center">
        <div className="flex-col">
          {title && icons ? (
            <span className={`${styles.title} block`}>
              {title}&nbsp;{icons}
            </span>
          ) : null}
          {description ? <p className={`${styles.description} m0`}>{description.split('\n')[0]}</p> : null}
        </div>
        <div className="align-center">
          <Button disabled={!rounded} onClick={() => onChange((rounded ?? 0) - 1)} className={styles.button}>
            <span>-</span>
          </Button>
          <input
            className={styles.input}
            type="number"
            inputMode="numeric"
            value={rounded ?? ''}
            placeholder="0"
            onChange={(event) => onChange(Math.ceil(Number(event.target.value)))}
            {...props}
          />
          <Button onClick={() => onChange((rounded ?? 0) + 1)} className={styles.button}>
            <span>+</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
