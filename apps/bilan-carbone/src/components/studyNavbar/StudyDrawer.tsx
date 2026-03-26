import { getStudyNavbarMenu } from '@/constants/navbar'
import { Environment, StudyRole } from '@prisma/client'
import classNames from 'classnames'
import { UUID } from 'crypto'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import StudyName from '../study/card/StudyName'
import styles from './StudyNavbar.module.css'

interface Props {
  studyId: UUID
  userRole: StudyRole | null
  environment: Environment
  studyName: string
  studySimplified: boolean
  isTransitionPlanActive: boolean
  hasObjectives: boolean
}

const StudyDrawer = ({
  studyId,
  userRole,
  environment,
  studyName,
  studySimplified,
  isTransitionPlanActive,
  hasObjectives,
}: Props) => {
  const pathName = usePathname()

  const t = useTranslations('study.navigation')

  const { title, sections } = getStudyNavbarMenu(
    environment,
    t,
    studyId,
    studyName,
    isTransitionPlanActive,
    hasObjectives,
    studySimplified,
  )
  return (
    <div className={styles.drawerContent}>
      <div className={classNames(styles.titleContainer, { [styles.hasRole]: userRole })}>
        <StudyName studyId={studyId} name={title.label} role={userRole} />
      </div>

      <div className={styles.menuContainer}>
        <div className={classNames('flex-col', sections.length === 1 && !sections[0].header ? '' : 'gapped15')}>
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="flex-col">
              {section.header && <div className={styles.sectionHeader}>{section.header}</div>}
              {section.links
                .filter((link) => !link.hide)
                .map((link, linkIndex) =>
                  link.disabled ? (
                    <button key={linkIndex} className={classNames(styles.link, styles.disabled)}>
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      prefetch={false}
                      key={linkIndex}
                      target={link.external ? '_blank' : undefined}
                      className={classNames(styles.link, {
                        [styles.active]: pathName === link.href || pathName.startsWith(`${link.href}/`),
                      })}
                      href={link.href || '#'}
                      {...(link.testId && { 'data-testid': link.testId })}
                    >
                      {link.label}
                    </Link>
                  ),
                )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default StudyDrawer
