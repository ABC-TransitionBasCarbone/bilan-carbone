'use client'

import { Action } from '@prisma/client'
import Fuse from 'fuse.js'
import { useMemo, useState } from 'react'
import ActionFilters from './ActionFilters'
import Table from './Table'

interface Props {
  actions: Action[]
  studyUnit: string
  porters: { label: string; value: string }[]
  transitionPlanId: string
}

const fuseOptions = {
  keys: [{ name: 'title', weight: 1 }],
  threshold: 0.3,
  isCaseSensitive: false,
}

const Actions = ({ actions, studyUnit, porters, transitionPlanId }: Props) => {
  const [filter, setFilter] = useState('')

  const fuse = useMemo(() => new Fuse(actions, fuseOptions), [actions])

  const searchedActions = useMemo(
    () => (filter ? fuse.search(filter).map(({ item }) => item) : actions),
    [actions, filter, fuse],
  )

  return (
    <>
      <ActionFilters
        search={filter}
        setSearch={setFilter}
        studyUnit={studyUnit}
        porters={porters}
        transitionPlanId={transitionPlanId}
      />
      <Table actions={searchedActions} studyUnit={studyUnit} porters={porters} transitionPlanId={transitionPlanId} />
    </>
  )
}

export default Actions
