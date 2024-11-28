import LinkButton from '@/components/base/LinkButton'
import { FullStudy } from '@/db/study'
import { Role, StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import { getTranslations } from 'next-intl/server'

interface Props {
  study: FullStudy
  userRole: User['role']
  userRoleOnStudy?: FullStudy['allowedUsers'][0]
}

const StudyChangeRightLink = async ({ study, userRole, userRoleOnStudy }: Props) => {
  const t = await getTranslations('study.rights')
  return (
    <LinkButton
      href={
        userRole === Role.ADMIN || (userRoleOnStudy && userRoleOnStudy.role !== StudyRole.Reader)
          ? `/etudes/${study.id}/cadrage/ajouter`
          : ''
      }
      data-testid={'study-rights-change-button'}
    >
      {t('newRightLink')}
    </LinkButton>
  )
}

export default StudyChangeRightLink
