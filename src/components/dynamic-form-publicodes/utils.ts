export type OnFormInputChange = (
  // NOTE: could be RuleName but keeping it string for simplicity for now
  ruleName: string,
  value: string | number | null,
) => void
