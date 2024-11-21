import { useTranslations } from 'next-intl'
import LocaleSelector from '@/components/navbar/LocaleSelector'
import Block from '@/components/base/Block'
import Link from 'next/link'
import Logout from '@/components/auth/Logout'

const Profile = () => {
  const t = useTranslations('profile')
  return (
    <Block title={t('title')} as="h1">
      <div className="mb1">
        <LocaleSelector />
      </div>
      <div className="mb1">
        <Logout />
      </div>
      <div className="mb1">
        <Link data-testid="legal-notices-link" href="/mentions-legales">
          {t('legalNotices')}
        </Link>
      </div>
    </Block>
  )
}

export default Profile
