import { InputAdornment, OutlinedInput } from '@mui/material'
import type { CSSProperties } from 'react'
import Button from '../Button/Button'
import styles from './MosaicNumberInput.module.css'

type Props = {
  title?: string
  icons?: string
  description?: string
  unit?: string
  onChange: (value: number) => void
  value?: number
}

export default function MosaicNumberInput({ title, icons, description, onChange, value, unit, ...props }: Props) {
  const rounded = value != null ? Math.ceil(value) : undefined
  const numLength = String(rounded ?? '').length || 1

  return (
    <div className={`${styles.element} p125`}>
      <div className="justify-between align-center">
        <div className={`flex-col ${styles.text}`}>
          {title && icons ? (
            <span className={`${styles.title} block`}>
              {title}&nbsp;{icons}
            </span>
          ) : (title ?
            <span className={`${styles.title} block`}>
              {title}
            </span> : null
          )}
          {description ? <p className={`${styles.description} m0`}>{description.split('\n')[0]}</p> : null}
        </div>
        <div className={`align-center ${styles.controls}`}>
          <Button disabled={!rounded} onClick={() => onChange((rounded ?? 0) - 1)} className={styles.button}>
            <span>-</span>
          </Button>
          <div className="relative">
            <OutlinedInput
              value={rounded ?? ''}
              className={styles.input}
              inputProps={{ className: styles.inputField, style: { '--num-len': numLength } as CSSProperties }}
              placeholder="0"
              onChange={(event) => onChange(Math.ceil(Number(event.target.value)))}
              {...props}
              endAdornment={unit ? <InputAdornment position="end" className={styles.unit}>{unit}</InputAdornment> : undefined}
            />
          </div>
          <Button onClick={() => onChange((rounded ?? 0) + 1)} className={styles.button}>
            <span>+</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
