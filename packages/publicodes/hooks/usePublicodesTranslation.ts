import { useTranslations } from 'next-intl'
import { getI18nKeyRuleName, getI18nUnitKey } from '../utils'
import { customRich } from '@abc-transitionbascarbone/utils/customRich'
import { EvaluatedGroupLayout, EvaluatedTableLayout } from '../form/layouts'

export function usePublicodesTranslation() {
  const tRules = useTranslations('publicodes-rules')
  return {
    getQuestionTranslation: (ruleName: string): string => {
      const key = `${getI18nKeyRuleName(ruleName)}.question`
      return tRules.has(key) ? tRules(key) : ruleName
    },
    getTitleTranslation: (ruleName: string): string => {
      const key = `${getI18nKeyRuleName(ruleName)}.titre`
      return tRules.has(key) ? tRules(key) : ruleName
    },
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
    question: tRules.has(`${ruleKey}.question`) ? customRich(tRules, `${ruleKey}.question`) : undefined,
    titre: tRules.has(`${ruleKey}.titre`) ? customRich(tRules, `${ruleKey}.titre`) : undefined,
    description: tRules.has(`${ruleKey}.description`) ? customRich(tRules,`${ruleKey}.description`) : undefined,
    getOptionLabel: (value: string | boolean | number) =>
      typeof value === 'boolean' ? customRich(tCommon, value ? 'yes' : 'no') : customRich(tOptions, String(value)),
  }
}

export const usePublicodesLayoutTranslation = <RuleName extends string>(formLayout: EvaluatedTableLayout<RuleName> | EvaluatedGroupLayout<RuleName>, type: string) => {
  const tLayout = useTranslations('publicodes-layout')
  return {
    title: tLayout.has(`${type}.${formLayout.title}`) ? customRich(tLayout, `${type}.${formLayout.title}`) : undefined,
    description: tLayout.has(`${type}.${formLayout.description}`) ? customRich(tLayout, `${type}.${formLayout.description}`) : undefined,
  }
}
