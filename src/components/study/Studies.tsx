'use server'

import AddIcon from '@mui/icons-material/Add'
import { Box } from '@mui/material'
import { Study } from '@prisma/client'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import styles from './Studies.module.css'
import StudyCard from './StudyCard'

interface Props {
  studies: Study[]
  canAddStudy: boolean
}

const Studies = async ({ studies, canAddStudy }: Props) => {
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
                href: '/etudes/creer',
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
              <StudyCard key={study.id} study={study} />
            ))}
          </ul>
        )}
      </Box>
    </Block>
  )
}

export default Studies
