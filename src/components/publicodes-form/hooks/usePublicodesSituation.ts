import Engine, { Situation } from 'publicodes'
import { useCallback, useState } from 'react'
import { getUpdatedSituationWithInputValue } from '../utils'

interface UsePublicodesSituationResult<RuleName extends string, S extends Situation<RuleName>> {
  situation: S
  updateField: (ruleName: RuleName, value: string | number | boolean | undefined) => void
}

export default function usePublicodesSituation<RuleName extends string, S extends Situation<RuleName>>(
  engine: Engine<RuleName>,
  initialSituation: S,
): UsePublicodesSituationResult<RuleName, S> {
  const [situation, setSituation] = useState<S>(initialSituation)

  const updateField = useCallback(
    (ruleName: RuleName, value: string | number | boolean | undefined) => {
      const newSituation = getUpdatedSituationWithInputValue(engine, situation, ruleName, value)
      engine.setSituation(newSituation)
      setSituation(newSituation as S)
    },
    [engine, situation],
  )
  return { situation, updateField }
}
