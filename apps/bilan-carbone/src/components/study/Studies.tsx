'use server'

import { StudyCardItem } from '@/db/study'
import Block, { Action } from '@abc-transitionbascarbone/components/src/base/Block'
import LinkButton from '@abc-transitionbascarbone/components/src/base/LinkButton'
import AddIcon from '@mui/icons-material/Add'
import { Box } from '@mui/material'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import dynamic from 'next/dynamic'
import styles from './Studies.module.css'
import StudyCard from './card/StudyCard'

const BetaBanner = dynamic(() => import('@/components/base/BetaBanner/BetaBanner'), {
  ssr: true,
})

interface Props {
  studies: StudyCardItem[]
  canAddStudy: boolean
  creationUrl?: string
  user: UserSession
  feedbackFormUrl?: string
  collaborations?: boolean
  simplified?: boolean
  showBetaBanner?: boolean
}

const Studies = async ({
  studies,
  canAddStudy,
  creationUrl,
  user,
  feedbackFormUrl,
  collaborations,
  simplified,
  showBetaBanner,
}: Props) => {
  const t = await getTranslations('study')
  const tResults = await getTranslations('study.results')
  const tFeedback = await getTranslations('feedback')
  const feedbackButtonLabel = tResults.has('feedback.button') ? tResults('feedback.button') : tFeedback('answer')

  let title = ''
  if (collaborations) {
    title = t('myCollaborations')
  } else if (simplified) {
    title = t('mySimplifiedStudies')
  } else {
    title = t('myStudies')
  }

  const actions: Action[] = [
    ...(canAddStudy
      ? [
          {
            actionType: 'link' as const,
            href: creationUrl,
            color: 'secondary' as const,
            variant: 'outlined' as const,
            ['data-testid']: 'new-study',
            children: (
              <>
                <AddIcon />
                {t(simplified ? 'createSimplified' : 'create')}
              </>
            ),
          },
        ]
      : []),
    ...(feedbackFormUrl
      ? [
          {
            actionType: 'node' as const,
            node: (
              <LinkButton
                data-testid="feedback-form-link-home"
                href={feedbackFormUrl}
                color="primary"
                variant="outlined"
                size="large"
                target="_blank"
                rel="noreferrer noopener"
              >
                {feedbackButtonLabel}
              </LinkButton>
            ),
          },
        ]
      : []),
  ]

  return (
    <Block title={title} data-testid="home-studies" actions={actions.length ? actions : undefined}>
      {showBetaBanner && <BetaBanner />}
      <Box className="flex-col grow">
        {studies.length && (
          <ul className={styles.grid}>
            {studies.map((study) => (
              <StudyCard key={study.id} study={study} user={user} simplified={simplified} />
            ))}
          </ul>
        )}
      </Box>
    </Block>
  )
}

export default Studies
