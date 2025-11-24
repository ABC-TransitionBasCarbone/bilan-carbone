export function isInNamespace<RuleName extends string>(ruleName: RuleName, namespace: RuleName): boolean {
  return ruleName.startsWith(namespace)
}
