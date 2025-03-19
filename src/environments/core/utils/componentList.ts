import { BASE, CUT, Environment } from '@/store/AppEnvironment'

export enum ComponentKey {
  Sites,

  NewStudyForm,
  StudyRights,
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
    [ComponentKey.StudyRights]: () => import('../../cut/study/StudyRights'),
  },
  [BASE]: {
    [ComponentKey.Sites]: () => import('../../base/organization/Sites'),

    [ComponentKey.NewStudyForm]: () => import('../../base/study/new/Form'),
    [ComponentKey.StudyRights]: () => import('../../base/study/StudyRights'),
  },
}

export default componentList
