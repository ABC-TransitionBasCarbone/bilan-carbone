'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export const STUDY = 'STUDY'
export const ORGANIZATION = 'ORGANIZATION'
export const OTHER = 'OTHER'

export type Context = typeof STUDY | typeof ORGANIZATION | typeof OTHER

const uuidv4Pattern = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/
const etudesPattern = new RegExp(`^/etudes/${uuidv4Pattern.source}`)
const organizationsPattern = new RegExp(`^/organisations/${uuidv4Pattern.source}`)

const RouteChangeListener = () => {
  const pathname = usePathname()
  const [context, setContext] = useState<Context>('OTHER')
  const [targetId, setTargetId] = useState('')

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
      setContext(newContext)
    }
    const newTargetId = getTargetId(pathname)
    if (targetId !== newTargetId) {
      setTargetId(newTargetId)
    }
  }, [pathname])

  return <></>
}

export default RouteChangeListener
