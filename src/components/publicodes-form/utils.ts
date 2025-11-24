export type OnFormInputChange<RuleName extends string> = (
  ruleName: RuleName,
  value: string | number | boolean | undefined,
) => void
