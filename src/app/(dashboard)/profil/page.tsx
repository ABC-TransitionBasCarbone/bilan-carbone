import Link from 'next/link'
import { useTranslations } from 'next-intl'

const Profile = () => {
  const t = useTranslations('profile')
  return (
    <>
      <h1>Profile</h1>
      <Link data-testid="legal-notices-link" href="/mentions-legales">
        {t('legal-notices')}
      </Link>
    </>
  )
}

export default Profile
