import { useTranslations } from 'next-intl'
import { getI18nKeyRuleName, getI18nUnitKey } from '../utils'

export function usePublicodesTranslation() {
  const tRules = useTranslations('publicodes-rules')
  return {
    getQuestionTranslation: (ruleName: string): string => tRules(`${getI18nKeyRuleName(ruleName)}.question`),
    getTitleTranslation: (ruleName: string): string => tRules(`${getI18nKeyRuleName(ruleName)}.titre`),
  }
}

export function usePublicodesUnitTranslation(unit: string | undefined): string | undefined {
  const tUnits = useTranslations('publicodes-units')
  const i18nUnitKey = unit ? getI18nUnitKey(unit) : unit
  return i18nUnitKey && tUnits.has(i18nUnitKey) ? tUnits(i18nUnitKey) : unit
}

export function usePublicodesRuleTranslation(ruleName: string) {
  const ruleKey = getI18nKeyRuleName(ruleName)
  const tCommon = useTranslations('common')
  const tRules = useTranslations('publicodes-rules')
  const tOptions = useTranslations(`publicodes-rules.${ruleKey}.options`)

  return {
    question: tRules(`${ruleKey}.question`),
    description: tRules.has(`${ruleKey}.description`) ? tRules(`${ruleKey}.description`) : undefined,
    getOptionLabel: (value: string | boolean | number): string =>
      typeof value === 'boolean' ? tCommon(value ? 'yes' : 'no') : tOptions(String(value)),
  }
}
