import { useTranslations } from 'next-intl'
import { getI18nKeyRuleName, getI18nUnitKey } from '../utils'
import { customRich } from '@abc-transitionbascarbone/i18n/customRich'

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
    question: customRich(tRules, `${ruleKey}.question`),
    titre: customRich(tRules, `${ruleKey}.titre`),
    description: tRules.has(`${ruleKey}.description`) ? customRich(tRules,`${ruleKey}.description`) : undefined,
    getOptionLabel: (value: string | boolean | number) =>
      typeof value === 'boolean' ? customRich(tCommon, value ? 'yes' : 'no') : customRich(tOptions, String(value)),
  }
}
