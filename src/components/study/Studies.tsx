'use server'

import AddIcon from '@mui/icons-material/Add'
import { Box } from '@mui/material'
import { Study } from '@prisma/client'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import Block from '../base/Block'
import styles from './Studies.module.css'
import StudyCard from './card/StudyCard'

interface Props {
  studies: Study[]
  canAddStudy: boolean
  creationUrl?: string
  user: UserSession
  collaborations?: boolean
  simplified?: boolean
}

const Studies = async ({ studies, canAddStudy, creationUrl, user, collaborations, simplified }: Props) => {
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
      <Box className="flex-col grow">
        {studies.length && (
          <ul className={styles.grid}>
            {studies.map((study) => (
              <Suspense key={study.id}>
                <StudyCard study={study} user={user} simplified={simplified} />
              </Suspense>
            ))}
          </ul>
        )}
      </Box>
    </Block>
  )
}

export default Studies
