'use client'

import Fuse from 'fuse.js'
import { useMemo, useState } from 'react'
import ActionFilters from './ActionFilters'

interface Props {
  actions: unknown[]
  studyId: string
  studyUnit: string
  porters: { label: string; value: string }[]
}

const fuseOptions = {
  keys: [{ name: 'metaData.title', weight: 1 }],
  threshold: 0.3,
  isCaseSensitive: false,
}

const Actions = ({ actions, studyId, studyUnit, porters }: Props) => {
  const [filter, setFilter] = useState('')

  const fuse = useMemo(() => new Fuse(actions, fuseOptions), [actions])

  const searchedActions = useMemo(() => {
    if (!filter) {
      return actions
    }
    const searchResults = filter ? fuse.search(filter).map(({ item }) => item) : actions

    return searchResults
  }, [actions, filter, fuse])

  return (
    <ActionFilters search={filter} setSearch={setFilter} studyId={studyId} studyUnit={studyUnit} porters={porters} />
  )
}

export default Actions
