import { getEnvVarClient } from '@/lib/environmentClient'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { Translations } from '@abc-transitionbascarbone/lib'
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
  const faq = getEnvVarClient('FAQ_LINK', env)
  const support = getEnvVarClient('SUPPORT_EMAIL', Environment.BC)
  const abc = getEnvVarClient('ABC_SITE', Environment.BC)

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
    abc: (children) => (
      <Link href={abc} target="_blank" rel="noreferrer noopener">
        {children}
      </Link>
    ),
    br: () => <br />,
    green: (children) => <span style={{ color: 'var(--mui-palette-ghgp-main)', fontSize: 'unset' }}>{children}</span>,
    purple: (children) => (
      <span style={{ color: 'var(--mui-palette-ghgp-complementary)', fontSize: 'unset' }}>{children}</span>
    ),
    ul: (children) => <ul>{children}</ul>,
    li: (children) => <li>{children}</li>,
    ...params,
  })
}
