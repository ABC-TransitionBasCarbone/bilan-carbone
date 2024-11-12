'use client'

import React, { useState } from 'react'
import styles from './StudyPostInfography.module.css'
import { Study } from '@prisma/client'
import Button from '../../base/Button'
import PostInfography from './PostsInfography'
import { useTranslations } from 'use-intl'

interface Props {
  study: Study
}

const StudyPostInfography = ({ study }: Props) => {
  const t = useTranslations('study.post')
  const [display, setDisplay] = useState(false)

  return (
    <>
      <Button
        className={styles.button}
        onClick={() => setDisplay(!display)}
        aria-expanded={display}
        aria-controls="study-post-infography"
      >
        {t(display ? 'hideInfography' : 'displayInfography')}
      </Button>
      {display && (
        <div className={styles.infography} id="study-post-infography">
          <PostInfography hideSubPosts study={study} />
        </div>
      )}
    </>
  )
}

export default StudyPostInfography
