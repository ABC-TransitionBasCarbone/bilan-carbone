'use server'

import AddIcon from '@mui/icons-material/Add'
import { Box } from '@mui/material'
import { Study } from '@prisma/client'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import Block from '../base/Block'
import styles from './Studies.module.css'
import StudyCard from './StudyCard'

interface Props {
  studies: Study[]
  canAddStudy: boolean
  creationUrl: string
}

const Studies = async ({ studies, canAddStudy, creationUrl }: Props) => {
  const t = await getTranslations('study')

  return (
    <Block
      title={t('myStudies')}
      data-testid="home-studies"
      actions={
        canAddStudy
          ? [
              {
                actionType: 'link',
                href: creationUrl,
                color: 'secondary',
                ['data-testid']: 'new-study',
                children: (
                  <>
                    <AddIcon />
                    {t('create')}
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
                <StudyCard study={study} />
              </Suspense>
            ))}
          </ul>
        )}
      </Box>
    </Block>
  )
}

export default Studies
