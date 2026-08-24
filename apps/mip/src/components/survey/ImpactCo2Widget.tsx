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
  const scriptSrc = getMipEnvVarClient('IMPACT_CO2_SCRIPT_SRC')

  useEffect(() => {
    const mountElement = mountRef.current

    if (!mountElement || !type) {
      return
    }

    if (!scriptSrc) {
      console.error('ImpactCo2Widget: missing IMPACT_CO2 script source', { type, search })
      return
    }

    mountElement.innerHTML = ''

    const script = document.createElement('script')
    script.src = scriptSrc
    script.async = true
    script.dataset.name = 'impact-co2'
    script.dataset.type = type
    script.dataset.search = search
    script.onerror = () => {
      console.error('ImpactCo2Widget: failed to load script', { src: scriptSrc, type, search })
    }

    mountElement.appendChild(script)

    return () => {
      if (mountRef.current) {
        mountRef.current.innerHTML = ''
      }
    }
  }, [scriptSrc, type, search])

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
