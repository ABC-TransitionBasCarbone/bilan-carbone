import { QuestionContainer } from '@abc-transitionbascarbone/publicodes/form'
import MosaicBooleanInput from '@abc-transitionbascarbone/ui/Form/MosaicBooleanInput'
import MosaicNumberInput from '@abc-transitionbascarbone/ui/Form/MosaicNumberInput'
import classNames from 'classnames'
import Engine from 'publicodes'
import styles from './MosaicQuestion.module.css'
import { usePublicodesRuleTranslation } from '../hooks'
import { getRuleNameParts, getRuleParentName } from './utils'

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
  containerVariant?: 'default' | 'flat'
}

export const MosaicQuestion = <RuleName extends string,>({
  parent,
  elements,
  engine,
  onChange,
}: Props<RuleName>) => {
  const rules = engine.getParsedRules()
  const parentRaw = rules[parent]?.rawNode as any
  const mosaicType = parentRaw?.mosaique?.type
  const translation = usePublicodesRuleTranslation(parent)

  const label = translation?.question ?? translation?.titre ?? parentRaw?.question ?? parentRaw?.titre ?? parent
  const description = translation?.description ?? parentRaw?.description

  return (
    <QuestionContainer label={label} description={description}>
      <div className={classNames(styles.mosaicContainer, 'gapped1 p1 grid')}>
        {elements.map((el, index) => {
          const parts = getRuleNameParts(el.id)
          const lastSegment = parts.slice(-2, -1)[0]
          const directParentName = getRuleParentName(el.id)
          const directParentRaw = directParentName ? ((rules[directParentName]?.rawNode as any) ?? undefined) : undefined
          const nombreRaw = rules[el.id]?.rawNode as any

          const title = nombreRaw?.titre ?? directParentRaw?.titre ?? lastSegment
          const icons = directParentRaw?.icônes
          const description = directParentRaw?.note
          const unit = nombreRaw?.unité

          if (mosaicType === 'nombre') {
            const value = el.element === 'input' && el.type === 'number' ? (el.value ?? el.defaultValue) : undefined
            return (
              <MosaicNumberInput
                key={el.id}
                title={title}
                icons={icons}
                unit={unit}
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
