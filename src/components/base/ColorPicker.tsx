import { MuiColorInput } from 'mui-color-input'
import styles from './ColorPicker.module.css'

interface Props {
  color: string
  disabled?: boolean
  onChange: (color: string) => void
}

const ColorPicker = ({ color, disabled, onChange }: Props) => (
  <MuiColorInput className={styles.picker} format="hex" value={color} onChange={onChange} disabled={disabled} />
)

export default ColorPicker
