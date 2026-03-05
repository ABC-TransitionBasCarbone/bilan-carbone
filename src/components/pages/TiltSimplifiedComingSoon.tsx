import Block from '@/components/base/Block'
import { Box, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './TiltSimplifiedComingSoon.module.css'

const TiltSimplifiedComingSoon = () => {
  const t = useTranslations('tiltSimplified')

  return (
    <Block>
      <Box className={classNames('flex-cc justify-center p2')} data-testid="tilt-simplified-coming-soon">
        <Box className={classNames('p3', styles.content)}>
          <Typography variant="h4" className="mb1 bold">
            {t('comingSoon.title')}
          </Typography>
          <Typography variant="body1">{t('comingSoon.message')}</Typography>
        </Box>
      </Box>
    </Block>
  )
}

export default TiltSimplifiedComingSoon
