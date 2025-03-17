import { Environment } from '@/store/AppEnvironment'
import dynamic from 'next/dynamic'
import componentList, { ComponentKey } from './componentList'

export const getComponent = (componentPath: ComponentKey, environment: Environment) => {
  const component = componentList[environment]?.[componentPath] || componentList.base?.[componentPath]
  if (!component) {
    throw new Error(`Component not found : ${componentPath}`)
  }
  return dynamic(component, { ssr: false })
}

export default getComponent
