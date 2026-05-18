import { InputQuestion, OnFieldChange } from '@abc-transitionbascarbone/publicodes/form'
import { EvaluatedFormLayout, EvaluatedListLayout } from '@abc-transitionbascarbone/publicodes/form/layouts'
import { usePublicodesRuleTranslation } from '@abc-transitionbascarbone/publicodes/hooks'
import { useTranslations } from 'next-intl'
import GroupQuestion from './GroupQuestion'
import ListQuestion from './ListQuestion'
import QuestionContainer from './QuestionContainer'
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
    <QuestionContainer label={question} helperText={description}>
      <ListQuestion listLayout={listLayout} onChange={onChange} />
    </QuestionContainer>
  )
}

export interface PublicodesQuestionProps<RuleName extends string> {
  formLayout: EvaluatedFormLayout<RuleName>
  onChange: OnFieldChange<RuleName>
}

export default function PublicodesQuestion<RuleName extends string>({
  formLayout,
  onChange,
}: PublicodesQuestionProps<RuleName>) {
  const tLayout = useTranslations('publicodes-layout')

  switch (formLayout.type) {
    case 'input': {
      return <InputQuestion formElement={formLayout.evaluatedElement} onChange={onChange} />
    }
    case 'group': {
      return (
        // TODO: handle helper text for layouts
        <QuestionContainer label={tLayout(`group.${formLayout.title}`)}>
          <GroupQuestion groupLayout={formLayout} onChange={onChange} />
        </QuestionContainer>
      )
    }
    case 'table': {
      return (
        // TODO: manage helper text for table
        <QuestionContainer label={tLayout(`table.${formLayout.title}`)}>
          <TableQuestion tableLayout={formLayout} onChange={onChange} />
        </QuestionContainer>
      )
    }
    case 'list': {
      return <ListQuestionContainer listLayout={formLayout} onChange={onChange} />
    }
  }
}
