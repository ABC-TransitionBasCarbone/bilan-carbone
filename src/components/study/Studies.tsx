'use server'

import { Box } from '@mui/material'
import { Study } from '@prisma/client'
import classNames from 'classnames'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import Link from '../base/Link'
import styles from './Studies.module.css'

interface Props {
  studies: Study[]
}

const Studies = async ({ studies }: Props) => {
  const t = await getTranslations('study')
  return (
    <Block title={t('myStudies')}>
      <Box data-testid="home-studies" className="flex-col grow">
        {studies.length && (
          <ul className={classNames(styles.list, 'flex-col')}>
            {studies.map((study) => (
              <li key={study.id}>
                <Link href={`/etudes/${study.id}`} data-testid="study" className={styles.link}>
                  {study.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Box>
    </Block>
  )
}

export default Studies
