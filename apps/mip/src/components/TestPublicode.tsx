'use client'
import { InputField, QuestionContainer } from '@abc-transitionbascarbone/publicodes/form'
import { FormBuilder } from '@publicodes/forms'
import { useMemo, useState } from 'react'
import { useMipPublicodes } from '../publicodes/MipPublicodesProvider'

export default function TestPublicode() {
  const { engine } = useMipPublicodes()
  const formBuilder = useMemo(() => new FormBuilder({ engine }), [engine])
  const [state, setState] = useState(() => {
    let s = FormBuilder.newState()
    s = formBuilder.start(s, 'bilan')
    return s
  })

  const { elements } = formBuilder.currentPage(state)
  const { current, pageCount, hasNextPage, hasPreviousPage } = formBuilder.pagination(state)

  return (
    <div>
      <p>
        Page {current} / {pageCount}
      </p>
      {elements.map((el) => (
        <QuestionContainer key={el.id} label={el.label ?? el.id}>
          <InputField
            formElement={el}
            onChange={(ruleName, value) => setState(formBuilder.handleInputChange(state, ruleName, value))}
          />
        </QuestionContainer>
      ))}
      <div>
        {hasPreviousPage && <button onClick={() => setState(formBuilder.goToPreviousPage(state))}>Précédent</button>}
        {hasNextPage && <button onClick={() => setState(formBuilder.goToNextPage(state))}>Suivant</button>}
      </div>
    </div>
  )
}
