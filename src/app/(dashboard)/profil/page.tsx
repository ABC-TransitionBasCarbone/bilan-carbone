import Logout from '@/components/auth/Logout'
import Block from '@/components/base/Block'
import withAuth from '@/components/hoc/withAuth'
import LocaleSelector from '@/components/navbar/LocaleSelector'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

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

export default withAuth(Profile)
