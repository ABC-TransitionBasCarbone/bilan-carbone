'use client'

import { Action } from '@prisma/client'
import Fuse from 'fuse.js'
import { useMemo, useState } from 'react'
import ActionFilters from './ActionFilters'
import Table from './Table'

interface Props {
  actions: Action[]
  studyId: string
  studyUnit: string
  porters: { label: string; value: string }[]
}

const fuseOptions = {
  keys: [{ name: 'title', weight: 1 }],
  threshold: 0.3,
  isCaseSensitive: false,
}

const Actions = ({ actions, studyId, studyUnit, porters }: Props) => {
  const [filter, setFilter] = useState('')

  const fuse = useMemo(() => new Fuse(actions, fuseOptions), [actions])

  const searchedActions = useMemo(
    () => (filter ? fuse.search(filter).map(({ item }) => item) : actions),
    [actions, filter, fuse],
  )

  return (
    <>
      <ActionFilters search={filter} setSearch={setFilter} studyId={studyId} studyUnit={studyUnit} porters={porters} />
      <Table actions={searchedActions} />
    </>
  )
}

export default Actions
