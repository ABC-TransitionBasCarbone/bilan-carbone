'use client'
import { Card, CardContent, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import styles from './RessourceLinks.module.css'

interface Props {
  title: string
  links: { title: string; link: string }[]
}

const RessourceLinks = ({ title, links }: Props) => {
  const t = useTranslations('ressources')
  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <div className={classNames(styles.cardHeader, 'p1')}>
          <Typography className="mb-2 bold text-center">{t(title)}</Typography>
        </div>
        <div className={styles.cardLinks}>
          {links.map(({ title, link }) => (
            <div className="mt-2 mb-2" key={link}>
              <Link href={link}>{t(title)}</Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default RessourceLinks
