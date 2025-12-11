import NavbarLink from '@/components/navbar/NavbarLink'
import { isAdmin } from '@/utils/user'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'

interface Props {
  user: UserSession
}

const OrganizationNavbar = ({ user }: Props) => {
  const t = useTranslations('navigation')
  return (
    <>
      {isAdmin(user.role) && (
        <NavbarLink href={`/organisations/${user.organizationVersionId}/modifier`}>{t('information')}</NavbarLink>
      )}
      <NavbarLink href="/equipe">{t('team')}</NavbarLink>
      <NavbarLink href="/organisations">{t('organizations')}</NavbarLink>
    </>
  )
}

export default OrganizationNavbar
