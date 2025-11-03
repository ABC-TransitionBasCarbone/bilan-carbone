'use client'

import { Action } from '@prisma/client'
import Fuse from 'fuse.js'
import { useMemo, useState } from 'react'
import ActionFilters from './ActionFilters'
import ActionTable from './ActionTable'

interface Props {
  actions: Action[]
  transitionPlanId: string
  studyUnit: string
  porters: { label: string; value: string }[]
}

const fuseOptions = {
  keys: [{ name: 'metaData.title', weight: 1 }],
  threshold: 0.3,
  isCaseSensitive: false,
}

const Actions = ({ actions, studyUnit, porters, transitionPlanId }: Props) => {
  const [filter, setFilter] = useState('')

  const fuse = useMemo(() => new Fuse(actions, fuseOptions), [actions])

  const searchedActions: Action[] = useMemo(() => {
    if (!filter) {
      return actions
    }
    const searchResults = filter ? fuse.search(filter).map(({ item }) => item) : actions

    return searchResults
  }, [actions, filter, fuse])

  return (
    <>
      <ActionFilters
        search={filter}
        setSearch={setFilter}
        transitionPlanId={transitionPlanId}
        studyUnit={studyUnit}
        porters={porters}
      />
      <ActionTable
        actions={searchedActions}
        studyUnit={studyUnit}
        porters={porters}
        transitionPlanId={transitionPlanId}
      />
    </>
  )
}

export default Actions
