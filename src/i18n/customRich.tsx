import { getEnvVar } from '@/lib/environment'
import { Translations } from '@/types/translation'
import { Environment } from '@prisma/client'
import Link from 'next/link'
import { ReactNode } from 'react'
import styles from './cutomRich.module.css'

type CustomRichParams = {
  [key: string]: ((children: ReactNode) => ReactNode) | string
}

export const customRich = (
  t: Translations,
  key: string,
  params?: CustomRichParams,
  env: Environment = Environment.BC,
) => {
  const faq = getEnvVar('FAQ_LINK', env)
  const support = getEnvVar('SUPPORT_EMAIL', Environment.BC)
  const linkStyle = env === Environment.CUT ? styles.linkCut : styles.link

  return t.rich(key, {
    error: (children) => <span className="error">{children}</span>,
    b: (children) => <span className="bold">{children}</span>,
    i: (children) => <span className="italic">{children}</span>,
    faq: (children) => (
      <Link href={faq} target="_blank" rel="noreferrer noopener" className={linkStyle}>
        {children}
      </Link>
    ),
    support: (children) => (
      <Link href={`mailto:${support}`} className={linkStyle}>
        {children}
      </Link>
    ),
    br: () => <br />,
    ...params,
  })
}
