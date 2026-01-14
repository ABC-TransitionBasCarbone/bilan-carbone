import { useTranslations } from 'next-intl'

export function usePublicodesRuleTranslation(ruleName: string) {
  const ruleKey = ruleName.replace(/\s+.\s+/g, '.')
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
