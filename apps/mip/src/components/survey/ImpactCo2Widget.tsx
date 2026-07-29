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
    if (!mountRef.current || !type) {
      return
    }

    mountRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://impactco2.fr/iframe.js'
    script.async = true
    script.dataset.name = 'impact-co2'
    script.dataset.type = type
    script.dataset.search = '?language=fr&theme=default'

    mountRef.current.appendChild(script)

    return () => {
      if (mountRef.current) {
        mountRef.current.innerHTML = ''
      }
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
