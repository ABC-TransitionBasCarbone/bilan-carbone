'use server'

import { EMAIL_CLIENT_CONFIGS } from '@/types/email'
import { Alert } from '@mui/material'
import { Environment } from '@prisma/client'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import RessourceLinks from '../ressources/RessourceLinks'
import styles from './Ressources.module.css'

interface Props {
  environment: Environment
}

const RessourcesPage = async ({ environment }: Props) => {
  const t = await getTranslations('ressources')
  const config = EMAIL_CLIENT_CONFIGS[environment]
  const supportEmail = config.supportEmail

  const ressources = [
    {
      title: t('enSavoirPlusBilan'),
      links: [{ title: t('methodeBilanCarbone'), link: 'https://www.bilancarbone-methode.com' }],
    },
    {
      title: t('questionMethodo'),
      links: [
        { title: t('openCarbonPractice'), link: 'https://www.opencarbonpractice.com/rejoindre-la-communaute' },
        {
          title: t('contacterViaFormulaire', { supportEmail }),
          link: config.contactFormUrl,
          isTranslated: true,
        },
      ],
    },
    {
      title: t('questionTechnique'),
      links: [
        { title: t('lireLaFAQ'), link: 'https://association-pour-la-transition-1.gitbook.io/bc+' },
        {
          title: t('ecrireMail', { supportEmail }),
          link: `mailto:${supportEmail}`,
          isTranslated: true,
        },
      ],
    },
  ]

  if (environment === Environment.TILT) {
    ressources.unshift({
      title: t('methodeAssociative'),
      links: [
        {
          title: t('sphereAssociative'),
          link: 'https://www.plancarbonegeneral.com/approches-sectorielles/sphere-associative',
        },
      ],
    })
  }

  return (
    <Block title={t('title')} as="h1">
      {environment === Environment.CUT && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t.rich('description', {
            br: () => <br />,
          })}
        </Alert>
      )}
      <div className={styles.ressources}>
        {ressources.map(({ title, links }) => (
          <RessourceLinks key={title} title={title} links={links} />
        ))}
      </div>
    </Block>
  )
}

export default RessourcesPage
