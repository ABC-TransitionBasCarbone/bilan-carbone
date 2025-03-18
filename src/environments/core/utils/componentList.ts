import { BASE, CUT, Environment } from '@/store/AppEnvironment'

export enum ComponentKey {
  Sites,
  NewStudyForm,
}

type ComponentMap = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key in ComponentKey]?: () => Promise<any>
}

type ComponentList = {
  [env in Environment]: ComponentMap
}

const componentList: ComponentList = {
  [CUT]: {
    [ComponentKey.Sites]: () => import('../../cut/organization/Sites'),
    [ComponentKey.NewStudyForm]: () => import('../../cut/study/new/Form'),
  },
  [BASE]: {
    [ComponentKey.Sites]: () => import('../../base/organization/Sites'),
    [ComponentKey.NewStudyForm]: () => import('../../base/study/new/Form'),
  },
}

export default componentList
