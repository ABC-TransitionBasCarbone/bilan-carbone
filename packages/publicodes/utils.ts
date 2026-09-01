import { convertInputValueToPublicodes } from '@publicodes/forms'
import Engine, { Situation } from 'publicodes'
import { ListLayoutSituations } from './context/types'

export const evaluateRuleValue = (engine: Engine, ruleName?: string): unknown => {
  if (!ruleName) {
    return undefined
  }

  try {
    return engine.evaluate(ruleName).nodeValue
  } catch (error) {
    console.error(`Error evaluating rule "${ruleName}":`, error)
    return undefined
  }
}

export const safeEvaluate = (engine: Engine, ruleName?: string): number => {
  const value = evaluateRuleValue(engine, ruleName)

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }

  return value
}

export const isInNamespace = <RuleName extends string>(ruleName: RuleName, namespace: RuleName) => {
  return ruleName.startsWith(namespace)
}

export const situationsAreEqual = <RuleName extends string>(
  sit1: Situation<RuleName>,
  sit2: Situation<RuleName>,
): boolean => {
  const keys1 = Object.keys(sit1)
  const keys2 = Object.keys(sit2)
  if (keys1.length !== keys2.length) {
    return false
  }

  return keys1.every((key) => sit1[key as RuleName] === sit2[key as RuleName])
}

export const getUpdatedSituationWithInputValue = <RuleName extends string>(
  engine: Engine<RuleName>,
  currentSituation: Situation<RuleName>,
  dottedName: RuleName,
  inputValue: string | number | boolean | undefined,
): Situation<RuleName> => {
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

export const aggregateSituationValues = <RuleName extends string>(
  engine: Engine<RuleName>,
  targetRule: RuleName,
  listLayoutSituations: Array<{ id: string; situation: Situation<RuleName> }>,
): number => {
  return Object.values(listLayoutSituations)
    .map(({ situation }) => situation)
    .reduce((acc, situation) => {
      const localEngine = engine.shallowCopy()
      localEngine.setSituation({ ...situation })

      const evaluatedTarget = localEngine.evaluate(targetRule)
      const targetValue = evaluatedTarget.nodeValue

      return typeof targetValue === 'number' ? acc + targetValue : acc
    }, 0)
}

export const getUpdatedSituationWithNewSituationList = <RuleName extends string>(
  listLayoutSituations: ListLayoutSituations<RuleName>,
  targetRule: RuleName,
  situationId: string,
  newSituationList: Situation<RuleName>,
): ListLayoutSituations<RuleName> => {
  const targetSituations = listLayoutSituations[targetRule]

  return {
    ...listLayoutSituations,
    [targetRule]: targetSituations
      ? targetSituations.map((situationEntry) =>
        situationEntry.id === situationId ? { ...situationEntry, situation: newSituationList } : situationEntry,
      )
      : [{ id: situationId, situation: newSituationList }],
  }
}

export const getI18nKeyRuleName = (ruleName: string) => ruleName.replace(/\s+.\s+/g, '.')

export const getI18nUnitKey = (unit: string) => unit.trim().replace(/\./g, '/')
