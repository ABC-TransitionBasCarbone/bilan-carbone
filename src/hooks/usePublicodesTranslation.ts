import { useTranslations } from 'next-intl'

const normalizeRuleName = (ruleName: string) => ruleName.replace(/\s+.\s+/g, '.')

export function usePublicodesTranslation() {
  const tRules = useTranslations('publicodes-rules')
  return {
    getQuestion: (ruleName: string): string => tRules(`${normalizeRuleName(ruleName)}.question`),
  }
}

export function usePublicodesRuleTranslation(ruleName: string) {
  const ruleKey = normalizeRuleName(ruleName)
  const tCommon = useTranslations('common')
  const tRules = useTranslations('publicodes-rules')
  const tOptions = useTranslations(`publicodes-rules.${ruleKey}.options`)

  return {
    question: tRules(`${ruleKey}.question`),
    description: tRules.has(`${ruleKey}.description`) ? tRules(`${ruleKey}.description`) : undefined,
    unit: tRules.has(`${ruleKey}.unité`) ? tRules(`${ruleKey}.unité`) : undefined,
    getOptionLabel: (value: string | boolean | number): string =>
      typeof value === 'boolean' ? tCommon(value ? 'yes' : 'no') : tOptions(String(value)),
  }
}
