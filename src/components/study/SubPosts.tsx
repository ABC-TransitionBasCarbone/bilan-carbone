import { Post, subPostsByPost } from '@/services/posts'
import { Study } from '@prisma/client'
import React, { useMemo } from 'react'
import styles from './SubPosts.module.css'
import classNames from 'classnames'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useTranslations } from 'next-intl'

interface Props {
  post: Post
  study: Study
}

const SubPosts = ({ post }: Props) => {
  const t = useTranslations('emissions.post')

  const subPosts = useMemo(() => subPostsByPost[post], [post])
  return (
    <div className={classNames(styles.subPosts, 'flex-col')}>
      {subPosts.map((subPost) => (
        <Accordion key={subPost}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`panel-${subPost}-content`}>
            {t(subPost)}
          </AccordionSummary>
          <AccordionDetails id={`panel-${subPost}-content`}>
            <div>TODO</div>
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  )
}

export default SubPosts
