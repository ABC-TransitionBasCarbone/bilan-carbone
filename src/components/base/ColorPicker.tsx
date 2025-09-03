import { MuiColorInput } from 'mui-color-input'
import styles from './ColorPicker.module.css'

interface Props {
  color: string
  onChange: (color: string) => void
}

const ColorPicker = ({ color, onChange }: Props) => (
  <MuiColorInput className={styles.picker} format="hex" value={color} onChange={onChange} />
)

export default ColorPicker
