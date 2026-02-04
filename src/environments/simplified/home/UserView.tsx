import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { typeDynamicComponent } from '@/environments/core/utils/dynamicUtils'
import { customRich } from '@/i18n/customRich'
import {
  hasHomeAlert,
  hasStartLinkOnFootprints,
  isTilt,
  isTiltSimplifiedFeatureActive,
} from '@/services/permissions/environment'
import { hasAccessToStudies } from '@/services/permissions/environmentAdvanced'
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined'
import { Alert, Box, Typography } from '@mui/material'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import CinemaOutlinedIcon from '../../cut/icons/CinemaOutlinedIcon'
import DiagramOutlinedIcon from '../icons/DiagramOutlinedIcon'
import LinkCard from './LinkCard'
import styles from './UserView.module.css'

interface Props {
  account: UserSession
}

const infoLength = 3

const UserView = async ({ account }: Props) => {
  const t = await getTranslations('home')
  const tAction = await getTranslations('common.action')

  const title = t('title')
  const navigation = await getTranslations('home.navigation')

  const hasAlert = hasHomeAlert(account.environment)

  let isFootprintsEnabled = false
  if (!isTilt(account.environment) || account.level) {
    isFootprintsEnabled = true
  } else {
    isFootprintsEnabled = await isTiltSimplifiedFeatureActive(account.environment)
  }

  return (
    <div className={styles.block}>
      <Box component="section" className="flex-col h100 gapped15">
        <Box className={classNames('align-center p2 gapped1 hauto', styles.styledBoxContainer, styles.styledBoxInfo)}>
          <Box className={classNames('flex-col', styles.leftContent)}>
            <Typography data-testid="title" variant="h4" className={styles.titleInBox}>
              {title}
            </Typography>
            {Array.from({ length: infoLength }, (_, i) => (
              <Box key={i} className={classNames('flex align-center', styles.bulletPoint)}>
                <Typography>{i + 1}.</Typography>
                <Typography>{t(`info.${i}`)}</Typography>
              </Box>
            ))}
          </Box>
          {isFootprintsEnabled && (
            <Box className="flex align-center">
              <Link
                href={hasStartLinkOnFootprints(account.environment) ? 'mes-empreintes' : '/organisations'}
                className={styles.startButtonLink}
              >
                <Box className={classNames('flex-cc px2 py1', styles.startButton)} component="button">
                  <Typography variant="h6" className={styles.startButtonText}>
                    {tAction('start')}
                  </Typography>
                </Box>
              </Link>
            </Box>
          )}
        </Box>
        <Box className="flex gapped1 mt1">
          <LinkCard
            href={`/organisations/${account.organizationVersionId}/modifier`}
            icon={
              <DynamicComponent
                defaultComponent={typeDynamicComponent({
                  component: CinemaOutlinedIcon,
                  props: { className: styles.icon },
                })}
                environment={account.environment}
              />
            }
            title={navigation('sites.title')}
            message={navigation('sites.message')}
          />
          <LinkCard
            href="/equipe"
            icon={<Groups2OutlinedIcon className={styles.icon} />}
            title={navigation('collaborators.title')}
            message={navigation('collaborators.message')}
          />
          {hasAccessToStudies(account.environment, account.level) ? (
            <LinkCard
              href="/organisations"
              icon={<DiagramOutlinedIcon className={styles.icon} />}
              title={navigation('footprints.title')}
              message={navigation('footprints.message')}
            />
          ) : isFootprintsEnabled ? (
            <LinkCard
              href="/mes-empreintes"
              icon={<DiagramOutlinedIcon className={styles.icon} />}
              title={navigation('footprints.title')}
              message={navigation('footprints.message')}
            />
          ) : null}
        </Box>
        {hasAlert && (
          <Alert severity="info" className="mb-2">
            {customRich(t, 'alert.info', {
              link: (chunks) => (
                <Link
                  href="https://www.guide-communication-climat.fr/definitions/approches-de-comptabilite-carbone"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chunks}
                </Link>
              ),
            })}
          </Alert>
        )}
      </Box>
    </div>
  )
}

export default UserView
