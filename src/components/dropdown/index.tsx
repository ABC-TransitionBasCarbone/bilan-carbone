import { ComponentProps } from 'react'
import classNames from 'classnames'
import styles from './styles.module.css'

export type SelectedOption = string | readonly string[] | number | undefined

interface Props extends ComponentProps<'select'> {
  id: string
  className?: string
  options: ComponentProps<'option'>[]
  label: string
  hiddenLabel?: boolean
  selectedOption?: SelectedOption
  onChangeValue: (selectedOption: SelectedOption) => void
}

const Dropdown = ({ id, className, label, hiddenLabel, options, selectedOption, onChangeValue, ...rest }: Props) => {
  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newOption = e.target.value as SelectedOption
    onChangeValue(newOption)
  }

  return (
    <>
      <label className={classNames({ [styles.hiddenLabel]: hiddenLabel })} htmlFor={`dropdown-${id}`}>
        {label}
      </label>
      <select
        id={`dropdown-${id}`}
        value={selectedOption}
        onChange={handleOptionChange}
        className={classNames(styles.select, className)}
        {...rest}
      >
        {options.map(({ value, ...rest }) => (
          <option key={`option-${value}`} value={value} {...rest}>
            {label}
          </option>
        ))}
      </select>
    </>
  )
}

export default Dropdown
