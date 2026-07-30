'use client'

import { useEffect, useRef } from 'react'

interface Props {
  type?: string
  className?: string
  testId?: string
}

const ImpactCo2Widget = ({ type, className, testId }: Props) => {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mountElement = mountRef.current

    if (!mountElement || !type) {
      return
    }

    mountElement.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://impactco2.fr/iframe.js'
    script.async = true
    script.dataset.name = 'impact-co2'
    script.dataset.type = type
    script.dataset.search = '?language=fr&theme=default'

    mountElement.appendChild(script)

    return () => {
      mountElement.innerHTML = ''
    }
  }, [type])

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
