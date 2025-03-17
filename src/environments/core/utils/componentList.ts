import { BASE, CUT, Environment } from '@/store/AppEnvironment'

export enum ComponentKey {
  Sites,
}

type ComponentMap = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key in ComponentKey]: () => Promise<any>
}

type ComponentList = {
  [env in Environment]: ComponentMap
}

const componentList: ComponentList = {
  [CUT]: {
    [ComponentKey.Sites]: () => import('../../cut/organization/Sites'),
  },
  [BASE]: {
    [ComponentKey.Sites]: () => import('../../base/organization/Sites'),
  },
}

export default componentList
