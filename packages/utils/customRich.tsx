import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { Translations } from '@abc-transitionbascarbone/lib'
import { getEnvVarClient, hasTranslatedLinks } from '@abc-transitionbascarbone/utils/environmentClient'
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
  const support = getEnvVarClient('SUPPORT_EMAIL', env)
  const getFaqUrl = () => (hasTranslatedLinks(env) ? t('faqUrl') : '')
  const getAbcUrl = () => (hasTranslatedLinks(env) ? t('abcSiteUrl') : '')

  return t.rich(key, {
    error: (children) => <span className="error">{children}</span>,
    b: (children) => <span className="bold">{children}</span>,
    i: (children) => <span className="italic">{children}</span>,
    br: () => <br />,
    link: (children) =>
      getFaqUrl() ? (
        <a href={getFaqUrl()} target="_blank" rel="noreferrer noopener" className="font-inherit">
          {children}
        </a>
      ) : (
        children
      ),
    faq: (children) =>
      getFaqUrl() ? (
        <a href={getFaqUrl()} target="_blank" rel="noreferrer noopener" className="font-inherit">
          {children}
        </a>
      ) : (
        children
      ),
    support: (children) => (
      <Link href={`mailto:${support}`} className="font-inherit">
        {children}
      </Link>
    ),
    abc: (children) =>
      getAbcUrl() ? (
        <Link href={getAbcUrl()} target="_blank" rel="noreferrer noopener" className="font-inherit">
          {children}
        </Link>
      ) : (
        children
      ),
    abcAssociation: (children) =>
      getAbcUrl() ? (
        <Link href={getAbcUrl()} target="_blank" rel="noreferrer noopener" className="font-inherit">
          {children}
        </Link>
      ) : (
        children
      ),
    guideecoresponsablebureautilttorefacto: (children) => (
      <Link
        className="font-inherit"
        href="https://associationbilancarbone.sharepoint.com/:b:/s/AssociationBilanCarbone/IQDSk3R5vX9eQYAsjwE3LWPoASe80Sd7WvaOOcu_wE7Uhf8?e=EABlMq"
        target="_blank"
        rel="noreferrer noopener"
      >
        {children}
      </Link>
    ),
    compteassotilttorefacto: (children) => (
      <Link
        className="font-inherit"
        href="https://lecompteasso.associations.gouv.fr/client/login"
        target="_blank"
        rel="noreferrer noopener"
      >
        {children}
      </Link>
    ),
    donneesdéplacementsdtINSEEetSDEStorefacto: (children) => (
      <Link
        className="font-inherit"
        href="https://mobilites-durables.transports.gouv.fr/indicateurs/deplacements-domicile-travail/"
        target="_blank"
        rel="noreferrer noopener"
      >
        {children}
      </Link>
    ),
    exemplequestionnairetorefacto: (children) => (
      <Link
        className="font-inherit"
        href="https://associationbilancarbone.sharepoint.com/:b:/s/AssociationBilanCarbone/IQCERvlL3mYjRbebNaYQJIdmAV6OhR4Ghh8K_7RIem35gGQ?e=rg6oey"
        target="_blank"
        rel="noreferrer noopener"
      >
        {children}
      </Link>
    ),
    underline: (children) => <span style={{ textDecoration: 'underline' }}>{children}</span>,
    green: (children) => <span className="font-inherit green-ghgp">{children}</span>,
    purple: (children) => <span className="font-inherit purple-ghgp">{children}</span>,
    white: (children) => <span style={{ color: 'white !important', fontSize: 'font-inherit' }}>{children}</span>,
    ul: (children) => <ul>{children}</ul>,
    li: (children) => <li>{children}</li>,
    ...params,
  })
}
