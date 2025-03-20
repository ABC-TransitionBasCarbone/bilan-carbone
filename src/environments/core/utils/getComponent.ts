import { CUT, Environment } from '@/store/AppEnvironment'

import SitesBase from '../../base/organization/Sites'
import NewStudyFormBase from '../../base/study/new/Form'
import StudyRightsBase from '../../base/study/StudyRights'

import SitesCut from '../../cut/organization/Sites'
import NewStudyFormCut from '../../cut/study/new/Form'
import StudyRightsCut from '../../cut/study/StudyRights'

export enum ComponentKey {
  Sites = 'Sites',

  NewStudyForm = 'NewStudyForm',
  StudyRights = 'StudyRights',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const baseComponents: Record<ComponentKey, React.ComponentType<any>> = {
  Sites: SitesBase,
  NewStudyForm: NewStudyFormBase,
  StudyRights: StudyRightsBase,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cutComponents: Partial<Record<ComponentKey, React.ComponentType<any>>> = {
  Sites: SitesCut,
  NewStudyForm: NewStudyFormCut,
  StudyRights: StudyRightsCut,
}

export const getComponent = (componentPath: ComponentKey, environment: Environment) => {
  if (environment === CUT && cutComponents[componentPath]) {
    return cutComponents[componentPath]!
  }

  if (baseComponents[componentPath]) {
    return baseComponents[componentPath]
  }

  throw new Error(`Component not found: ${componentPath}`)
}

export default getComponent
