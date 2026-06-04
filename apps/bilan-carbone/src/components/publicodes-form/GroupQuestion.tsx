import { OnFieldChange } from '@abc-transitionbascarbone/publicodes/form'
import { CheckboxInput } from '@abc-transitionbascarbone/publicodes/form/inputFields'
import { EvaluatedGroupLayout } from '@abc-transitionbascarbone/publicodes/form/layouts'
import { FormControl } from '@mui/material'

interface GroupQuestionProps<RuleName extends string> {
  groupLayout: EvaluatedGroupLayout<RuleName>
  onChange: OnFieldChange<RuleName>
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

        return (
          <CheckboxInput
            key={`box-${element.id}-${index}`}
            evaluatedElement={element}
            index={index}
            onChange={onChange}
          />
        )
      })}
    </FormControl>
  )
}
