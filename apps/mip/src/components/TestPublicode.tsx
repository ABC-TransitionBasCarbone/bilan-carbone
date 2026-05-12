'use client'
import { FormBuilder } from '@publicodes/forms'
import { useState, useMemo } from 'react'
import { useMipPublicodes } from '../publicodes/MipPublicodesProvider'

export default function TestPublicode() {
  const { engine } = useMipPublicodes()
  
  const formBuilder = useMemo(() => new FormBuilder({ engine }), [engine])
  const [state, setState] = useState(() => {
    let s = FormBuilder.newState()
    s = formBuilder.start(s, 'bilan')
    return s
  })

  const { title, elements } = formBuilder.currentPage(state)
  const { current, pageCount, hasNextPage, hasPreviousPage } = formBuilder.pagination(state)

  return (
    <div>
      <p>Page {current} / {pageCount}</p>
      {elements.map((el) => (
        <div key={el.id}>
          <label>{el.label}</label>
          <input
            onChange={(e) => setState(formBuilder.handleInputChange(state, el.id, e.target.value))}
          />
        </div>
      ))}
      <div>
        {hasPreviousPage && (
          <button onClick={() => setState(formBuilder.goToPreviousPage(state))}>Précédent</button>
        )}
        {hasNextPage && (
          <button onClick={() => setState(formBuilder.goToNextPage(state))}>Suivant</button>
        )}
      </div>
    </div>
  )
}