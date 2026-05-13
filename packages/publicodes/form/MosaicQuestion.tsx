import { QuestionContainer } from '@abc-transitionbascarbone/publicodes/form'
import MosaicBooleanInput from '@abc-transitionbascarbone/ui/src/Form/MosaicBooleanInput'
import MosaicNumberInput from '@abc-transitionbascarbone/ui/src/Form/MosaicNumberInput'
import { EvaluatedFormElement, FormPageElementProp } from '@publicodes/forms'
import Engine from 'publicodes'

type Props = {
  parent: string
  elements: Array<EvaluatedFormElement<string> & FormPageElementProp>
  engine: Engine
  onChange: (ruleName: string, value: string | number | boolean | undefined) => void
}

export function MosaicQuestion({ parent, elements, engine, onChange }: Props) {
  const rules = engine.getParsedRules()
  const parentRaw = rules[parent]?.rawNode as any
  const mosaicType = parentRaw?.mosaique?.type
  const label = parentRaw?.question ?? parentRaw?.titre ?? parent

  return (
    <QuestionContainer label={label}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {elements.map((el, index) => {
          const elRaw = rules[el.id]?.rawNode as any
          const parts = el.id.split(' . ')
          const lastSegment = parts.slice(-2, -1)[0]
          const directParentName = parts.slice(0, -1).join(' . ')
          const directParentRaw = rules[directParentName]?.rawNode as any
          const nombreRaw = rules[el.id]?.rawNode as any

          const title = nombreRaw?.titre ?? lastSegment
          const icons = directParentRaw?.icônes
          const description = directParentRaw?.note

          if (mosaicType === 'nombre') {
            const value = el.element === 'input' && el.type === 'number' ? (el.value ?? el.defaultValue) : undefined
            return (
              <MosaicNumberInput
                key={el.id}
                title={title}
                icons={icons}
                description={description}
                value={value as number | undefined}
                onChange={(value) => onChange(el.id, value)}
              />
            )
          }

          if (mosaicType === 'selection') {
            const currentValue = (() => {
              if (el.element === 'input' && el.type === 'checkbox') return el.checked ?? el.defaultChecked ?? false
              return false
            })()
            return (
              <MosaicBooleanInput
                key={el.id}
                title={title}
                icons={icons}
                description={description}
                value={currentValue}
                onChange={(value) => onChange(el.id, value)}
                index={index}
              />
            )
          }

          return null
        })}
      </div>
    </QuestionContainer>
  )
}
