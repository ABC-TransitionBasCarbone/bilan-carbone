import { getStudyNavbarMenu } from '@/constants/navbar'
import { Environment, StudyRole } from '@repo/db-common/enums'
import classNames from 'classnames'
import { UUID } from 'crypto'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import HelpIcon from '../base/HelpIcon'
import Modal from '../modals/Modal'
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
  const [glossaryInfo, setGlossaryInfo] = useState<{ id: string; label: string; info: string } | null>(null)

  const t = useTranslations('study.navigation')
  const tCommon = useTranslations('common')

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
                .map((link, linkIndex) => {
                  return link.disabled ? (
                    <button key={linkIndex} className={classNames(styles.link, styles.disabled)}>
                      {link.label}
                    </button>
                  ) : (
                    <div key={linkIndex} className={classNames({ [styles.linkWithInfo]: !!link.info })}>
                      <Link
                        prefetch={false}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className={classNames(styles.link, {
                          [styles.active]: pathName === link.href || pathName.startsWith(`${link.href}/`),
                        })}
                        href={link.href || '#'}
                        {...(link.testId && { 'data-testid': link.testId })}
                      >
                        {link.label}
                      </Link>
                      {link.info && (
                        <HelpIcon
                          className={styles.infoIcon}
                          label={tCommon('moreInfo')}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setGlossaryInfo({ id: `${sectionIndex}-${linkIndex}`, label: link.label, info: link.info! })
                          }}
                        />
                      )}
                    </div>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
      {glossaryInfo && (
        <Modal
          open
          label={`study-navbar-link-info-${glossaryInfo.id}`}
          title={glossaryInfo.label}
          onClose={() => setGlossaryInfo(null)}
          actions={[{ actionType: 'button', onClick: () => setGlossaryInfo(null), children: tCommon('close') }]}
        >
          {glossaryInfo.info}
        </Modal>
      )}
    </div>
  )
}
export default StudyDrawer
