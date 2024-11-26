import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import NewMemberForm from '../team/NewMemberForm'

const NewMemberPage = () => {
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
        <NewMemberForm />
      </Block>
    </>
  )
}

export default NewMemberPage
