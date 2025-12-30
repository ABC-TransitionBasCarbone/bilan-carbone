import { convertInputValueToPublicodes } from '@publicodes/forms'
import Engine, { Situation } from 'publicodes'

export function isInNamespace<RuleName extends string>(ruleName: RuleName, namespace: RuleName): boolean {
  return ruleName.startsWith(namespace)
}

export function situationsAreEqual<RuleName extends string>(
  sit1: Situation<RuleName>,
  sit2: Situation<RuleName>,
): boolean {
  const keys1 = Object.keys(sit1)
  const keys2 = Object.keys(sit2)
  if (keys1.length !== keys2.length) {
    return false
  }

  return keys1.every((key) => sit1[key as RuleName] === sit2[key as RuleName])
}

export function getUpdatedSituationWithInputValue<RuleName extends string>(
  engine: Engine<RuleName>,
  currentSituation: Situation<RuleName>,
  dottedName: RuleName,
  inputValue: string | number | boolean | undefined,
): Situation<RuleName> {
  const situationValue = convertInputValueToPublicodes(engine, dottedName, inputValue)

  if (situationValue === undefined) {
    if (!(dottedName in currentSituation)) {
      return currentSituation
    }

    const { [dottedName]: _, ...rest } = currentSituation
    return rest as Situation<RuleName>
  }

  return {
    ...currentSituation,
    [dottedName]: situationValue,
  }
}
