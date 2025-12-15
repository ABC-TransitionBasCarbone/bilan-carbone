import { Box } from '@mui/material'
import Engine, { Situation } from 'publicodes'
import { useMemo } from 'react'
import { getEvaluatedFormLayout } from './layouts/evaluatedFormLayout'
import { FormLayout } from './layouts/formLayout'
import PublicodesQuestion from './PublicodesQuestion'
import styles from './styles/PublicodesForm.module.css'
import {
  areRulesReferencedInApplicability,
  evaluatedLayoutIsApplicable,
  getRuleNamesFromLayout,
  OnFieldChange,
} from './utils'

export interface PublicodesFormProps<RuleName extends string, S extends Situation<RuleName>> {
  engine: Engine<RuleName>
  situation: S
  onFieldChange: OnFieldChange<RuleName>
  formLayouts: FormLayout<RuleName>[]
}

export default function PublicodesForm<RuleName extends string, S extends Situation<RuleName>>({
  engine,
  situation,
  onFieldChange,
  formLayouts,
}: PublicodesFormProps<RuleName, S>) {
  const elementsWithRelation = useMemo(() => {
    // FIXME: should manage multiple questions linked to previous ones.
    return formLayouts.map((formLayout, index) => {
      const evaluatedFormLayout = getEvaluatedFormLayout(engine, formLayout, situation)
      const currentRuleNames = getRuleNamesFromLayout(formLayout)
      const previousRuleNames = index > 0 ? getRuleNamesFromLayout(formLayouts[index - 1]) : undefined
      const isLinkedToPreviousQuestion =
        currentRuleNames &&
        previousRuleNames &&
        areRulesReferencedInApplicability((rule: RuleName) => engine.getRule(rule), currentRuleNames, previousRuleNames)

      const key =
        formLayout.type === 'input'
          ? formLayout.rule
          : formLayout.type === 'group'
            ? `group-${index}`
            : `table-${formLayout.title}-${index}`

      const isApplicable = evaluatedLayoutIsApplicable(evaluatedFormLayout)
      return { evaluatedFormLayout, isLinkedToPreviousQuestion, key, isApplicable }
    })
  }, [formLayouts, engine, situation])

  return (
    <Box className="dynamic-form">
      <Box>
        {elementsWithRelation.map(({ key, evaluatedFormLayout, isApplicable, isLinkedToPreviousQuestion }) => {
          return isApplicable ? (
            <Box key={key}>
              {isLinkedToPreviousQuestion && <Box className={styles.relationLine} />}
              <PublicodesQuestion formLayout={evaluatedFormLayout} onChange={onFieldChange} />
            </Box>
          ) : null
        })}
      </Box>
    </Box>
  )
}
