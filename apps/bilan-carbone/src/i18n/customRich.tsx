import { getEnvVarClient } from '@/lib/environmentClient'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { Translations } from '@abc-transitionbascarbone/lib'
import Link from 'next/link'
import { ReactNode } from 'react'

type CustomRichParams = {
  [key: string]: ((children: ReactNode) => ReactNode) | ReactNode | string | number | undefined
}

export const customRich = (
  t: Translations,
  key: string,
  params: CustomRichParams = {},
  env: Environment = Environment.BC,
) => {
  const faq = getEnvVarClient('FAQ_LINK', env)
  const support = getEnvVarClient('SUPPORT_EMAIL', Environment.BC)
  const abc = getEnvVarClient('ABC_SITE', Environment.BC)

  return t.rich(key, {
    error: (children) => <span className="error">{children}</span>,
    b: (children) => <span className="bold">{children}</span>,
    i: (children) => <span className="italic">{children}</span>,
    faq: (children) => (
      <Link href={faq} target="_blank" rel="noreferrer noopener">
        {children}
      </Link>
    ),
    support: (children) => <Link href={`mailto:${support}`}>{children}</Link>,
    abc: (children) => (
      <Link href={abc} target="_blank" rel="noreferrer noopener">
        {children}
      </Link>
    ),
    abcAssociation: (children) => (
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
