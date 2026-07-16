import {
  InputQuestion,
  MosaicQuestion,
  OnFieldChange,
  QuestionContainer,
} from '@abc-transitionbascarbone/publicodes/form'
import {
  EvaluatedFormLayout,
  EvaluatedGroupLayout,
  EvaluatedListLayout,
  EvaluatedTableLayout,
} from '@abc-transitionbascarbone/publicodes/form/layouts'
import {
  usePublicodesLayoutTranslation,
  usePublicodesRuleTranslation,
} from '@abc-transitionbascarbone/publicodes/hooks'
import Engine from 'publicodes'
import GroupQuestion from './GroupQuestion'
import ListQuestion from './ListQuestion'
import TableQuestion from './TableQuestion'

function ListQuestionContainer<RuleName extends string>({
  listLayout,
  onChange,
}: {
  listLayout: EvaluatedListLayout<RuleName>
  onChange: OnFieldChange<RuleName>
}) {
  const { question, description } = usePublicodesRuleTranslation(listLayout.targetRule)

  return (
    <QuestionContainer label={question} description={description}>
      <ListQuestion listLayout={listLayout} onChange={onChange} />
    </QuestionContainer>
  )
}

const GroupLayout = <RuleName extends string>({
  formLayout,
  onChange,
}: {
  formLayout: EvaluatedGroupLayout<RuleName>
  onChange: OnFieldChange<RuleName>
}) => {
  const { description, title } = usePublicodesLayoutTranslation(formLayout, 'group')

  return (
    <QuestionContainer label={title} description={description}>
      <GroupQuestion groupLayout={formLayout} onChange={onChange} />
    </QuestionContainer>
  )
}
const TableLayout = <RuleName extends string>({
  formLayout,
  onChange,
}: {
  formLayout: EvaluatedTableLayout<RuleName>
  onChange: OnFieldChange<RuleName>
}) => {
  const { description, title } = usePublicodesLayoutTranslation(formLayout, 'table')

  return (
    <QuestionContainer label={title} description={description}>
      <TableQuestion tableLayout={formLayout} onChange={onChange} />
    </QuestionContainer>
  )
}

export interface PublicodesQuestionProps<RuleName extends string> {
  formLayout: EvaluatedFormLayout<RuleName>
  onChange: OnFieldChange<RuleName>
  engine: Engine
}

export default function PublicodesQuestion<RuleName extends string>({
  engine,
  formLayout,
  onChange,
}: PublicodesQuestionProps<RuleName>) {
  switch (formLayout.type) {
    case 'input': {
      return <InputQuestion formElement={formLayout.evaluatedElement} onChange={onChange} />
    }
    case 'mosaic': {
      return (
        <MosaicQuestion
          onChange={onChange}
          engine={engine}
          parent={formLayout.parent}
          elements={formLayout.evaluatedChildren}
        />
      )
    }
    case 'group': {
      return <GroupLayout formLayout={formLayout} onChange={onChange} />
    }
    case 'table': {
      return <TableLayout formLayout={formLayout} onChange={onChange} />
    }
    case 'list': {
      return <ListQuestionContainer listLayout={formLayout} onChange={onChange} />
    }
  }
}
