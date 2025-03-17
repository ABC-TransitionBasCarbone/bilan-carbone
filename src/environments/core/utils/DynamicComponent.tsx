'use client'

import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { CircularProgress } from '@mui/material'
import { useEffect, useState } from 'react'
import { ComponentKey } from './componentList'
import getComponent from './getComponent'

interface Props {
  componentPath: ComponentKey
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

const DynamicComponent: React.FC<Props> = ({ componentPath, ...props }) => {
  const [Component, setComponent] = useState<React.ComponentType | null>(null)
  const { environment } = useAppEnvironmentStore()

  useEffect(() => {
    const loadComponent = async () => {
      try {
        const loadedComponent = getComponent(componentPath, environment)
        setComponent(() => loadedComponent)
      } catch (error) {
        console.error('Error loading component:', error)
      }
    }

    loadComponent()
  }, [componentPath])

  if (!Component) {
    return (
      <div className="flex justify-center mt2 mb2">
        <CircularProgress />
      </div>
    )
  }

  return <Component {...props} />
}

export default DynamicComponent
