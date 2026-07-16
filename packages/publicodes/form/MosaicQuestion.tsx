import { QuestionContainer } from '@abc-transitionbascarbone/publicodes/form'
import MosaicBooleanInput from '@abc-transitionbascarbone/ui/Form/MosaicBooleanInput'
import MosaicNumberInput from '@abc-transitionbascarbone/ui/Form/MosaicNumberInput'
import classNames from 'classnames'
import Engine from 'publicodes'
import styles from './MosaicQuestion.module.css'
import { usePublicodesRuleTranslation } from '../hooks'

type Props<RuleName> = {
  parent: RuleName
  elements: {
    id: RuleName
    element: 'input' | 'RadioGroup' | 'select' | 'textarea'
    type?: string
    value?: string | number | boolean
    defaultValue?: string | number | boolean
  }[]
  engine: Engine
  onChange: (ruleName: RuleName, value: string | number | boolean | undefined) => void
}

export function MosaicQuestion<RuleName extends string>({ parent, elements, engine, onChange }: Props<RuleName>) {
  const rules = engine.getParsedRules()
  const parentRaw = rules[parent]?.rawNode as any
  const mosaicType = parentRaw?.mosaique?.type
  const translation = usePublicodesRuleTranslation(parent)
  
  const label = translation?.question ?? translation?.titre ?? parent

  return (
    <QuestionContainer label={label}>
      <div className={styles.mosaicContainer}>
        {elements.map((el, index) => {
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
            const currentValue =
              el.element === 'RadioGroup' ? (el.value as unknown) === true || el.value === 'oui' : false

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
