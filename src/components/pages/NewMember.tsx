import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import { UserSessionProps } from '../hoc/withAuth'
import NewMemberForm from '../team/NewMemberForm'

const NewMemberPage = ({ user }: UserSessionProps) => {
  const tNav = useTranslations('nav')
  const t = useTranslations('newMember')
  return (
    <>
      <Breadcrumbs
        current={t('title')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: tNav('team'), link: '/equipe' },
        ]}
      />
      <Block title={t('title')} as="h1">
        <NewMemberForm environment={user.environment} />
      </Block>
    </>
  )
}

export default NewMemberPage
