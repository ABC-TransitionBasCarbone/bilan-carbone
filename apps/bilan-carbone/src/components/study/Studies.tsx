'use server'

import { StudyCardItem } from '@/db/study'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
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
  collaborations?: boolean
  simplified?: boolean
  showBetaBanner?: boolean
}

const Studies = async ({
  studies,
  canAddStudy,
  creationUrl,
  user,
  collaborations,
  simplified,
  showBetaBanner,
}: Props) => {
  const t = await getTranslations('study')

  let title = ''
  if (collaborations) {
    title = t('myCollaborations')
  } else if (simplified) {
    title = t('mySimplifiedStudies')
  } else {
    title = t('myStudies')
  }

  return (
    <Block
      title={title}
      data-testid="home-studies"
      actions={
        canAddStudy
          ? [
              {
                actionType: 'link',
                href: creationUrl,
                color: 'secondary',
                variant: 'outlined',
                ['data-testid']: 'new-study',
                children: (
                  <>
                    <AddIcon />
                    {t(simplified ? 'createSimplified' : 'create')}
                  </>
                ),
              },
            ]
          : undefined
      }
    >
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
