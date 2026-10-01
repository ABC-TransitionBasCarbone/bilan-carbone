'use server'

import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudiesContainer from '../study/StudiesContainer'

interface Props {
  organizationVersionId: string
  organizationName: string
  user: UserSession
}

const SimplifiedStudiesContainer = async ({ organizationVersionId, organizationName, user }: Props) => {
  const tNav = await getTranslations('nav')

  return (
    <>
      <Breadcrumbs current={organizationName} links={[{ label: tNav('home'), link: '/' }]} />
      <StudiesContainer user={user} organizationVersionId={organizationVersionId} simplified />
    </>
  )
}

export default SimplifiedStudiesContainer
