import { Checkbox, FormControl, FormControlLabel, styled } from '@mui/material'
import { EvaluatedFormElement, EvaluatedGroupLayout, FormPageElementProp } from '@publicodes/forms'
import { OnFormInputChange } from './utils'

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  backgroundColor: 'white',
  border: `solid 1px ${theme.custom.box.borderColor}`,
  borderRadius: '1rem',
  width: 'fit-content',
}))

const formatOption = (option: string) => option.replace(/^\d*-/, '')

interface GroupQuestionProps<RuleName extends string> {
  groupLayout: EvaluatedGroupLayout<RuleName>
  onChange: OnFormInputChange<RuleName>
}

/**
 * NOTE: for now, this is more a QCM (multiple checkbox) component but it could
 * be extended to support other group types in the future.
 */
export default function GroupQuestion<RuleName extends string>({
  groupLayout: { evaluatedElements },
  onChange,
}: GroupQuestionProps<RuleName>) {
  return (
    <FormControl className="flex-col m2">
      {evaluatedElements.map((element, index) => {
        if (element.element !== 'input' || element.type !== 'checkbox') {
          return null
        }

        // Type assertion for checkbox elements
        const checkboxElement = element as EvaluatedFormElement<RuleName> &
          FormPageElementProp & {
            element: 'input'
            type: 'checkbox'
            checked?: boolean
          }

        console.log('checkboxElement:', checkboxElement)
        const isChecked = checkboxElement.checked ?? false
        const isDisabled = !checkboxElement.applicable

        return (
          <StyledFormControlLabel
            key={`box-${checkboxElement.id}-${index}`}
            className="p-2 pr1 flex-row align-center mb1"
            control={
              <Checkbox
                name={String(checkboxElement.id)}
                checked={isChecked}
                disabled={isDisabled}
                onChange={(e) => onChange(checkboxElement.id, e.target.checked)}
              />
            }
            label={formatOption(checkboxElement.label)}
          />
        )
      })}
    </FormControl>
  )
}
