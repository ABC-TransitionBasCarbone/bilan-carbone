import { GroupedElement } from '@/components/survey/surveyGrouping'
import { createMipEngine } from '@/publicodes/mip-engine'
import { InputQuestion, MosaicQuestion } from '@abc-transitionbascarbone/publicodes/form'
import { FormBuilder, FormState } from '@publicodes/forms'
import { Dispatch, SetStateAction } from 'react'

type MipEngine = ReturnType<typeof createMipEngine>

interface Props {
  groupedElements: GroupedElement[]
  engine: MipEngine
  formBuilder: FormBuilder<string>
  updateState: Dispatch<SetStateAction<FormState<string>>>
}

const SurveyQuestionList = ({ groupedElements, engine, formBuilder, updateState }: Props) => {
  return (
    <div className="p0">
      {groupedElements.map((group) =>
        group.type === 'mosaic' ? (
          <MosaicQuestion
            key={group.parent}
            parent={group.parent}
            elements={group.elements}
            engine={engine}
            containerVariant="flat"
            onChange={(ruleName, value) =>
              updateState((prevState) => formBuilder.handleInputChange(prevState, ruleName, value))
            }
          />
        ) : (
          <InputQuestion
            key={group.el.id}
            formElement={group.el}
            engine={engine}
            containerVariant="flat"
            onChange={(ruleName, value) =>
              updateState((prevState) => formBuilder.handleInputChange(prevState, ruleName, value))
            }
          />
        ),
      )}
    </div>
  )
}

export default SurveyQuestionList
