'use client'

import { Context, ORGANIZATION, OTHER, STUDY, useAppContextStore } from '@/store/AppContext'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const uuidv4Pattern = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/
const etudesPattern = new RegExp(`^/etudes/${uuidv4Pattern.source}`)
const organizationsPattern = new RegExp(`^/organisations/${uuidv4Pattern.source}`)

const RouteChangeListener = () => {
  const pathname = usePathname()
  const [context, setLocalContext] = useState<Context>('OTHER')
  const [contextId, setLocalContextId] = useState('')

  const { setContext, setContextId } = useAppContextStore()

  const getContext = (pathname: string): Context => {
    if (etudesPattern.test(pathname)) {
      return STUDY
    }
    if (organizationsPattern.test(pathname)) {
      return ORGANIZATION
    }
    return OTHER
  }

  const getTargetId = (pathname: string) => {
    const match = pathname.match(uuidv4Pattern)
    return match ? match[0] : ''
  }

  useEffect(() => {
    const newContext = getContext(pathname)
    if (context !== newContext) {
      setLocalContext(newContext)
      setContext(newContext)
    }
    const newContextId = getTargetId(pathname)
    if (contextId !== newContextId) {
      setLocalContextId(newContextId)
      setContextId(newContextId)
    }
  }, [pathname])

  return <></>
}

export default RouteChangeListener
