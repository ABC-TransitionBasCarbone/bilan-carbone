'use client'

import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined'
import { Alert, Box, BoxProps, styled, Typography } from '@mui/material'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import CinemaOutlinedIcon from '../icons/CinemaOutlinedIcon'
import DiagramOutlinedIcon from '../icons/DiagramOutlinedIcon'
import LinkCard from './LinkCard'
import styles from './UserView.module.css'

interface Props {
  account: UserSession
}

const infoLength = 3

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  borderColor: theme.palette.primary.main,
  backgroundColor: theme.palette.secondary.light,
  color: theme.palette.text.primary,
}))

const UserView = ({ account }: Props) => {
  const t = useTranslations('home')
  const title = t('title')
  const navigation = useTranslations('home.navigation')

  return (
    <div className={styles.block}>
      <Box component="section" className={classNames('flex-col', 'h100', 'gapped15')}>
        <StyledBox
          className={classNames(
            'align-center',
            'p2',
            'gapped1',
            'hauto',
            styles.styledBoxContainer,
            styles.styledBoxInfo,
          )}
        >
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
          <Box className="flex align-center">
            <Link href="/organisations" className={classNames(styles.startButtonLink)}>
              <Box className={classNames('flex-cc', 'px2', 'py1', styles.startButton)} component="button">
                <Typography variant="h6" className={styles.startButtonText}>
                  {t('start')}
                </Typography>
              </Box>
            </Link>
          </Box>
        </StyledBox>
        <Box className={classNames('flex', 'gapped1', 'mt1')}>
          <LinkCard
            href={`/organisations/${account.organizationVersionId}/modifier`}
            icon={<CinemaOutlinedIcon className={styles.icon} />}
            title={navigation('sites.title')}
            message={navigation('sites.message')}
          />
          <LinkCard
            href="/equipe"
            icon={<DynamicComponent defaultComponent={<Groups2OutlinedIcon className={styles.icon} />} />}
            title={navigation('collaborators.title')}
            message={navigation('collaborators.message')}
          />
          <LinkCard
            href="/organisations"
            icon={<DynamicComponent defaultComponent={<DiagramOutlinedIcon className={styles.icon} />} />}
            title={navigation('footprints.title')}
            message={navigation('footprints.message')}
          />
        </Box>
        <Alert severity="info" className="mb-2">
          {t.rich('alert.info', {
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
      </Box>
    </div>
  )
}

export default UserView
