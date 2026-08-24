import { useTranslations } from 'next-intl'
import { getI18nKeyRuleName, getI18nUnitKey } from '../utils'
import { customRich } from '@abc-transitionbascarbone/utils/customRich'
import { EvaluatedGroupLayout, EvaluatedTableLayout } from '../form/layouts'

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
    question: tRules.has(`${ruleKey}.question`) ? customRich(tRules, `${ruleKey}.question`) : undefined,
    titre: tRules.has(`${ruleKey}.titre`) ? customRich(tRules, `${ruleKey}.titre`) : undefined,
    description: tRules.has(`${ruleKey}.description`) ? customRich(tRules,`${ruleKey}.description`) : undefined,
    getOptionLabel: (value: string | boolean | number) => {
      if (typeof value === 'boolean') {
        return customRich(tCommon, value ? 'yes' : 'no')
      }

      const optionKey = String(value)
      return tOptions.has(optionKey) ? customRich(tOptions, optionKey) : optionKey
    },
  }
}

export const usePublicodesLayoutTranslation = <RuleName extends string>(formLayout: EvaluatedTableLayout<RuleName> | EvaluatedGroupLayout<RuleName>, type: string) => {
  const tLayout = useTranslations('publicodes-layout')
  return {
    title: tLayout.has(`${type}.${formLayout.title}`) ? customRich(tLayout, `${type}.${formLayout.title}`) : undefined,
    description: tLayout.has(`${type}.${formLayout.description}`) ? customRich(tLayout, `${type}.${formLayout.description}`) : undefined,
  }
}
