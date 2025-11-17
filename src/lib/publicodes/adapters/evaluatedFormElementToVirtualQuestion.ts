import { Question, QuestionType, SubPost } from '@prisma/client'
import { EvaluatedFormElement } from '@publicodes/forms'

export function createVirtualQuestion(formElement: EvaluatedFormElement, subPost: SubPost, order: number): Question {
  const type = getQuestionType(formElement)
  const possibleAnswers = getPossibleAnswers(formElement)

  return {
    id: formElement.id,
    idIntern: formElement.id,
    label: formElement.label,
    type,
    order,
    subPost,
    // TODO: retrieve unit
    unit: null,
    possibleAnswers: [],
    required: formElement.required,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function getQuestionType(formElement: EvaluatedFormElement): QuestionType {
  switch (formElement.element) {
    case 'input':
      switch (formElement.type) {
        case 'number':
          return QuestionType.NUMBER
        // TODO: handle month type properly
        case 'month':
        case 'date':
          return QuestionType.DATE
        case 'checkbox':
          return QuestionType.QCU
        case 'text':
        default:
          return QuestionType.TEXT
      }
    case 'RadioGroup':
      return QuestionType.QCU
    case 'select':
      return QuestionType.SELECT
    case 'textarea':
      return QuestionType.TEXT
  }
}

function getPossibleAnswers(formElement: EvaluatedFormElement): string[] {
  if (formElement.element === 'select' || formElement.element === 'RadioGroup') {
    return formElement.options.map((option) => option.label)
  }

  return []
}
