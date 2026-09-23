import { HelpIcon } from '@abc-transitionbascarbone/components'
import { usePublicodesRuleTranslation } from '@abc-transitionbascarbone/publicodes/hooks'
import { FormControl, FormControlLabel, Radio, styled } from '@mui/material'
import { EvaluatedRadioGroup } from '@publicodes/forms'
import classNames from 'classnames'
import { useState } from 'react'
import { BaseInputProps } from './utils'
import styles from './RadioGroupInput.module.css'

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }: { theme: any }) => {
  const borderColor = theme.custom?.box?.borderColor

  return {
    backgroundColor: 'white',
    border: `solid 1px ${borderColor}`,
    borderRadius: '1rem',
    width: 'fit-content',
  }
})

interface RadioGroupInputProps<RuleName extends string> extends BaseInputProps<RuleName> {
  formElement: EvaluatedRadioGroup<RuleName>
}

const RadioGroupInput = <RuleName extends string>({
  formElement,
  onChange,
  onBlur,
  errorMessage,
  disabled,
}: RadioGroupInputProps<RuleName>) => {
  const { getOptionLabel } = usePublicodesRuleTranslation(formElement.id)
  const [openOptionIndex, setOpenOptionIndex] = useState<number | null>(null)
  const flexDirection = formElement.orientation === 'horizontal' ? 'flex-row' : 'flex-col'

  return (
    <FormControl className={classNames(flexDirection, 'm2', 'gapped1')} error={!!errorMessage} disabled={disabled}>
      {formElement.options.map((option, index) => {
        const isDescriptionOpen = openOptionIndex === index

        return (
          <div key={`box-${index}`} className="flex-row align-center wrap gapped025 wfit">
            <StyledFormControlLabel
              className="p-2 pr1 flex-row align-center mb0"
              label={<span>{getOptionLabel(option.value, option.label)}</span>}
              control={
                <Radio
                  onBlur={onBlur}
                  name={option.label}
                  checked={(formElement.value ?? formElement.defaultValue) === option.value}
                  onChange={(e) => onChange(formElement.id, e.target.checked ? option.value : undefined)}
                />
              }
            />
            {option.description && (
              <HelpIcon
                onClick={(event) => {
                  event.stopPropagation()
                  setOpenOptionIndex(isDescriptionOpen ? null : index)
                }}
                label="Afficher l'aide"
                fontSize="small"
              />
            )}
            {isDescriptionOpen && <div className={classNames(styles.description, 'w100')}>{option.description}</div>}
          </div>
        )
      })}
    </FormControl>
  )
}

export default RadioGroupInput
