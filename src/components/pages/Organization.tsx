import { OrganizationWithSites } from '@/db/userAuth'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import OrganizationInfo from '../organization/Info'
import StudiesContainer from '../study/StudiesContainer'

interface Props {
  organizations: OrganizationWithSites[]
  user: User
}

const OrganizationPage = ({ organizations, user }: Props) => {
  const tNav = useTranslations('nav')

  return (
    <>
      <Breadcrumbs current={organizations[0].name} links={[{ label: tNav('home'), link: '/' }]} />
      <OrganizationInfo organization={organizations[0]} user={user} />
      <StudiesContainer user={user} organizationId={organizations[0].id} />
    </>
  )
}

export default OrganizationPage
