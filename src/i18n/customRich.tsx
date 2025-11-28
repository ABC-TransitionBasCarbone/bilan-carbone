import { getEnvVar } from '@/lib/environment'
import { Translations } from '@/types/translation'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import Link from 'next/link'
import { ReactNode } from 'react'

type CustomRichParams = {
  [key: string]: ((children: ReactNode) => ReactNode) | ReactNode | string | number | undefined
}

type StylesParams = {
  [key: string]: string
}

export const customRich = (
  t: Translations,
  key: string,
  params: CustomRichParams = {},
  env: Environment = Environment.BC,
  styles: StylesParams = {},
) => {
  const faq = getEnvVar('FAQ_LINK', env)
  const support = getEnvVar('SUPPORT_EMAIL', Environment.BC)

  return t.rich(key, {
    error: (children: ReactNode) => <span className={classNames('error', styles.error)}>{children}</span>,
    b: (children: ReactNode) => <span className={classNames('bold', styles.b)}>{children}</span>,
    i: (children: ReactNode) => <span className={classNames('italic', styles.i)}>{children}</span>,
    faq: (children: ReactNode) => (
      <Link href={faq} target="_blank" rel="noreferrer noopener" className={styles.faq}>
        {children}
      </Link>
    ),
    support: (children: ReactNode) => (
      <Link href={`mailto:${support}`} className={styles.support}>
        {children}
      </Link>
    ),
    br: () => <br />,
    ...params,
  })
}
