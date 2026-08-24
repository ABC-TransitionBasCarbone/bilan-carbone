'use client'

import { getMipEnvVarClient } from '@/utils/environmentClient'
import { useEffect, useRef } from 'react'

interface Props {
  type?: string
  search?: string
  className?: string
  testId?: string
}

const ImpactCo2Widget = ({
  type,
  search = getMipEnvVarClient('IMPACT_CO2_DEFAULT_SEARCH'),
  className,
  testId,
}: Props) => {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mountElement = mountRef.current

    if (!mountElement || !type) {
      return
    }

    mountElement.innerHTML = ''

    const script = document.createElement('script')
    script.src = getMipEnvVarClient('IMPACT_CO2_SCRIPT_SRC')
    script.async = true
    script.dataset.name = 'impact-co2'
    script.dataset.type = type
    script.dataset.search = search

    mountElement.appendChild(script)

    return () => {
      if (mountRef.current) {
        mountRef.current.innerHTML = ''
      }
    }
  }, [type, search])

  if (!type) {
    return null
  }

  return (
    <div className={className} data-testid={testId}>
      <div ref={mountRef} />
    </div>
  )
}

export default ImpactCo2Widget
