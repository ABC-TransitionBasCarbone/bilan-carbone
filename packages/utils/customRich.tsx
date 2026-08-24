import { getEnvVarClient } from '@abc-transitionbascarbone/utils/environmentClient'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { Translations } from '@abc-transitionbascarbone/lib'
import Link from 'next/link'
import { ReactNode } from 'react'
import classNames from 'classnames'

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
      <Link href={faq} target="_blank" rel="noreferrer noopener" className="font-inherit">
        {children}
      </Link>
    ),
    support: (children) => (
      <Link href={`mailto:${support}`} className="font-inherit">
        {children}
      </Link>
    ),
    abc: (children) => (
      <Link href={abc} target="_blank" rel="noreferrer noopener" className="font-inherit">
        {children}
      </Link>
    ),
    abcAssociation: (children) => (
      <Link href={abc} target="_blank" rel="noreferrer noopener" className="font-inherit">
        {children}
      </Link>
    ),
    guideecoresponsablebureautilttorefacto: (children) => (
      <Link className="font-inherit" href="https://associationbilancarbone.sharepoint.com/:b:/s/AssociationBilanCarbone/IQDSk3R5vX9eQYAsjwE3LWPoASe80Sd7WvaOOcu_wE7Uhf8?e=EABlMq" target="_blank" rel="noreferrer noopener">
        {children}
      </Link>
    ),
    compteassotilttorefacto: (children) => (
      <Link className="font-inherit" href="https://lecompteasso.associations.gouv.fr/client/login" target="_blank" rel="noreferrer noopener">
        {children}
      </Link>
    ),
    donneesdéplacementsdtINSEEetSDEStorefacto: (children) => (
      <Link className="font-inherit" href="https://mobilites-durables.transports.gouv.fr/indicateurs/deplacements-domicile-travail/" target="_blank" rel="noreferrer noopener">
        {children}
      </Link>
    ),
    br: () => <br />,
    underline: (children) => <span style={{ textDecoration: 'underline' }}>{children}</span>,
    green: (children) => <span className="font-inherit green-ghgp">{children}</span>,
    purple: (children) => (
      <span className="font-inherit purple-ghgp">{children}</span>
    ),
    white: (children) => <span style={{ color: 'white !important', fontSize: 'font-inherit' }}>{children}</span>,
    ul: (children) => <ul>{children}</ul>,
    li: (children) => <li>{children}</li>,
    ...params,
  })
}
