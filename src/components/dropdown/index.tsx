import styles from './styles.module.css'
import { useTranslations } from 'next-intl'

export type SelectedOption = string | number

export interface DropdownOption {
  value: SelectedOption
  label: string
}

const Dropdown = (props: Props) => {
  const { className, label, options, selectedOption, height, width, testId, onChange } = props

  const propsStyle = {
    minWidth: width ? `${width}rem` : '10rem',
    minHeight: height ? `${height}rem` : '1.5rem',
  }
  const t = useTranslations('')

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newOption = e.target.value
    onChange(newOption)
  }

  return (
    <>
      {label && <label htmlFor="dropdown">{t(label)}</label>}
      <select
        id="dropdown"
        value={selectedOption}
        onChange={handleOptionChange}
        className={`${styles.select} ${className}`}
        style={propsStyle}
        data-testid={testId}
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </>
  )
}

interface Props {
  className?: string
  options: DropdownOption[]
  label?: string // Best practice to add a label to selectors
  selectedOption?: SelectedOption
  height?: number
  width?: number
  testId?: string
  onChange: (selectedOption: SelectedOption) => void
}

export default Dropdown
