import {
  getMosaicSuggestionEntries,
  SuggestionsRecord,
} from '@abc-transitionbascarbone/common/publicodes/form/suggestions'
import { getRuleNameParts, getRuleParentName } from '@abc-transitionbascarbone/common/publicodes/form/utils'
import { usePublicodesRuleTranslation } from '@abc-transitionbascarbone/common/publicodes/hooks'
import MosaicBooleanInput from '@abc-transitionbascarbone/common/ui/Form/MosaicBooleanInput'
import MosaicNumberInput from '@abc-transitionbascarbone/common/ui/Form/MosaicNumberInput'
import classNames from 'classnames'
import Engine from 'publicodes'
import styles from './MosaicQuestion.module.css'
import { QuestionContainer } from './QuestionContainer'
import { SuggestionChips } from './SuggestionChips'

type Props<RuleName extends string> = {
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
  defaultAsPlaceholder?: boolean
}

export const MosaicQuestion = <RuleName extends string>({
  parent,
  elements,
  engine,
  onChange,
  defaultAsPlaceholder = false,
}: Props<RuleName>) => {
  const rules = engine.getParsedRules()
  const parentRaw = rules[parent]?.rawNode as any
  const mosaicType = parentRaw?.mosaique?.type
  const translation = usePublicodesRuleTranslation(parent)
  const rawSuggestions = (parentRaw?.mosaique?.suggestions ?? parentRaw?.suggestions) as SuggestionsRecord | undefined
  const suggestionEntries = getMosaicSuggestionEntries(parent, elements, rawSuggestions)

  const label = translation?.question ?? translation?.titre ?? parentRaw?.question ?? parentRaw?.titre ?? parent
  const description = translation?.description ?? parentRaw?.description

  return (
    <QuestionContainer label={label} description={description}>
      <SuggestionChips
        ruleName={parent}
        suggestions={suggestionEntries}
        onSelect={(changes) => {
          for (const change of changes) {
            onChange(change.ruleName, change.value)
          }
        }}
      />
      <div className={classNames(styles.mosaicContainer, 'gapped1 p1 grid')}>
        {elements.map((el, index) => {
          const parts = getRuleNameParts(el.id)
          const lastSegment = parts.slice(-2, -1)[0]
          const directParentName = getRuleParentName(el.id)
          const directParentRaw = directParentName
            ? ((rules[directParentName]?.rawNode as any) ?? undefined)
            : undefined
          const nombreRaw = rules[el.id]?.rawNode as any

          const title = nombreRaw?.titre ?? directParentRaw?.titre ?? lastSegment
          const icons = directParentRaw?.icônes
          const description = directParentRaw?.note
          const unit = nombreRaw?.unité

          if (mosaicType === 'nombre') {
            const value =
              el.element === 'input' && el.type === 'number'
                ? (el.value ?? (defaultAsPlaceholder ? undefined : el.defaultValue))
                : undefined
            return (
              <MosaicNumberInput
                key={el.id}
                title={title}
                icons={icons}
                unit={unit}
                description={description}
                value={value as number | undefined}
                placeholder={defaultAsPlaceholder ? String(el.defaultValue ?? '0') : undefined}
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
