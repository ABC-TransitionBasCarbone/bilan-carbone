import { usePublicodesForm } from '@/lib/publicodes/context'
import { Box } from '@mui/material'
import { useMemo } from 'react'
import { getEvaluatedFormLayout } from './layouts/evaluatedFormLayout'
import { FormLayout } from './layouts/formLayout'
import styles from './PublicodesForm.module.css'
import PublicodesQuestion from './PublicodesQuestion'
import { areRulesReferencedInApplicability, evaluatedLayoutIsApplicable, getRuleNamesFromLayout } from './utils'

export interface PublicodesFormProps<RuleName extends string> {
  formLayouts: FormLayout<RuleName>[]
}

export default function PublicodesForm<RuleName extends string>({ formLayouts }: PublicodesFormProps<RuleName>) {
  const { engine, situation, listLayoutSituations, updateField } = usePublicodesForm<RuleName>()

  const elementsWithRelation = useMemo(() => {
    // FIXME: should manage multiple questions linked to previous ones.
    return formLayouts.map((formLayout, index) => {
      const evaluatedFormLayout = getEvaluatedFormLayout(engine, formLayout, listLayoutSituations)
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
            : formLayout.type === 'list'
              ? `list-${formLayout.targetRule}-${index}`
              : `table-${formLayout.title}-${index}`

      const isApplicable = evaluatedLayoutIsApplicable(evaluatedFormLayout)
      return { evaluatedFormLayout, isLinkedToPreviousQuestion, key, isApplicable }
    })
  }, [
    formLayouts,
    engine,
    // NOTE: the situation needs to be a dependency to re-evaluate applicability when it changes
    situation,
  ])

  return (
    <Box className="dynamic-form">
      <Box>
        {elementsWithRelation.map(({ key, evaluatedFormLayout, isApplicable, isLinkedToPreviousQuestion }) => {
          return isApplicable ? (
            <Box key={key}>
              {isLinkedToPreviousQuestion && <Box className={styles.relationLine} />}
              <PublicodesQuestion formLayout={evaluatedFormLayout} onChange={updateField} />
            </Box>
          ) : null
        })}
      </Box>
    </Box>
  )
}
