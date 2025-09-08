'use client'
import { Card, CardContent, Typography } from '@mui/material'
import classNames from 'classnames'
import Link from 'next/link'
import styles from './RessourceLinks.module.css'

interface Props {
  title: string
  links: { title: string; link: string }[]
}

const RessourceLinks = ({ title, links }: Props) => {
  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <div className={classNames(styles.cardHeader, 'p1')}>
          <Typography className="mb-2 bold text-center">{title}</Typography>
        </div>
        <div className={classNames(styles.cardLinks, 'text-center')}>
          {links.map(({ title, link }) => (
            <div className="mt-2 mb-2" key={link}>
              <Link href={link}>{title}</Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default RessourceLinks
