import { FullStudy } from '@/db/study'
import React from 'react'

interface Props {
  study: FullStudy
  emissionSource: FullStudy['emissionSources'][0]
}

const EmissionSource = ({ emissionSource }: Props) => {
  return <div>{emissionSource.name}</div>
}

export default EmissionSource
