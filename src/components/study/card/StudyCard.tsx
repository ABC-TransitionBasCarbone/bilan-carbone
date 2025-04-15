import { getStudyValidatedEmissionsSources } from '@/db/study'
import LinearProgress from '@mui/material/LinearProgress'
import { Study } from '@prisma/client'
import classNames from 'classnames'
import { getTranslations } from 'next-intl/server'
import Box from '../../base/Box'
import LinkButton from '../../base/LinkButton'
import GlossaryIconModal from '../../modals/GlossaryIconModal'
import styles from './StudyCard.module.css'
import StudyName from './StudyName'

interface Props {
  study: Study
}

const StudyCard = async ({ study }: Props) => {
  const t = await getTranslations('study')
  const values = await getStudyValidatedEmissionsSources(study.id)

  if (!values) {
    return null
  }

  const percent = values.validated ? Math.floor((values.validated / values.total) * 100) : 0
  const color = values.validated > 0 && percent === 100 ? '--success-100' : '--warning'

  return (
    <li data-testid="study" className="flex">
      <Box className={classNames(styles.card, 'flex-col grow')}>
        <div className="justify-center">
          <StudyName name={study.name} />
        </div>
        <Box>
          <p className="mb1 align-center">
            {t.rich('validatedSources', {
              validated: values.validated,
              total: values.total,
              data: (children) => (
                <span className={classNames(styles.validated, 'mr-4', { [styles.success]: percent === 100 })}>
                  {children}
                </span>
              ),
            })}
            <GlossaryIconModal
              title="validatedOnly"
              className="ml-2"
              iconLabel="information"
              label="study-card"
              tModal="study"
            >
              {t('validatedOnlyDescription')}
            </GlossaryIconModal>
          </p>
          <LinearProgress
            variant="determinate"
            value={percent}
            sx={{
              backgroundColor: 'var(--grayscale-200)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: `var(${color})`,
              },
            }}
          />
        </Box>
        <div className="justify-end">
          <LinkButton href={`/etudes/${study.id}`}>{t('see')}</LinkButton>
        </div>
      </Box>
    </li>
  )
}

export default StudyCard
