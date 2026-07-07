import { GroupedElement } from '@/components/survey/surveyGrouping'
import { createMipEngine } from '@/publicodes/mip-engine'
import { InputQuestion, MosaicQuestion } from '@abc-transitionbascarbone/publicodes/form'
import { FormBuilder, FormState } from '@publicodes/forms'
import styles from './Survey.module.css'

type MipEngine = ReturnType<typeof createMipEngine>

interface Props {
  groupedElements: GroupedElement[]
  engine: MipEngine
  state: FormState<string>
  formBuilder: FormBuilder<string>
  updateState: (newState: FormState<string>) => void
}

const SurveyQuestionList = ({ groupedElements, engine, state, formBuilder, updateState }: Props) => {
  return (
    <div className={styles.questionCard}>
      {groupedElements.map((group) =>
        group.type === 'mosaic' ? (
          <MosaicQuestion
            key={group.parent}
            parent={group.parent}
            elements={group.elements}
            engine={engine}
            onChange={(ruleName, value) => updateState(formBuilder.handleInputChange(state, ruleName, value))}
          />
        ) : (
          <InputQuestion
            key={group.el.id}
            formElement={group.el}
            onChange={(ruleName, value) => updateState(formBuilder.handleInputChange(state, ruleName, value))}
          />
        ),
      )}
    </div>
  )
}

export default SurveyQuestionList
