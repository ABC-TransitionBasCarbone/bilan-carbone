'use server'

import { customRich } from '@/i18n/customRich'
import { getEnvVar } from '@/lib/environment'
import { Alert } from '@mui/material'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import RessourceLinks from '../ressources/RessourceLinks'
import styles from './Ressources.module.css'

interface Props {
  environment: Environment
}

interface Ressource {
  title: string
  links: { title: string; link?: string; downloadKey?: string; isTranslated?: boolean }[]
}

const RessourcesPage = async ({ environment }: Props) => {
  const t = await getTranslations('ressources')
  const contactForm = getEnvVar('CONTACT_FORM_URL', environment)
  const faq = getEnvVar('FAQ_LINK', environment)
  const supportEmail = getEnvVar('SUPPORT_EMAIL', environment)
  const methodUrl = getEnvVar('METHOD_URL', environment)

  const methodBC = {
    title: t('enSavoirPlusBilan'),
    links: [{ title: t('methodeBilanCarbone'), link: methodUrl }],
  }

  const otherResources: Ressource[] = [
    {
      title: t('questionMethodo'),
      links: [
        { title: t('openCarbonPractice'), link: 'https://www.opencarbonpractice.com/rejoindre-la-communaute' },
        {
          title: t('contacterViaFormulaire', { supportEmail }),
          link: contactForm,
          isTranslated: true,
        },
      ],
    },
    {
      title: t('questionTechnique'),
      links: [
        { title: t('lireLaFAQ'), link: faq },
        {
          title: t('ecrireMail', { supportEmail }),
          link: `mailto:${supportEmail}`,
          isTranslated: true,
        },
      ],
    },
  ]

  // Show BC method at the end for CUT
  const ressources = environment === Environment.CUT ? [...otherResources, methodBC] : [methodBC, ...otherResources]

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

  if (environment === Environment.CUT) {
    ressources.unshift({
      title: t('countMethods'),
      links: [
        {
          title: t('countMethodLink'),
          downloadKey: 'SCW_CUT_METHOD_KEY',
        },
        {
          title: t('resilioMethodLink'),
          downloadKey: 'SCW_RESILIO_METHOD_KEY',
        },
      ],
    })
  }

  const clicksonRessources = [
    {
      title: t('knowMoreDataCollect'),
      links: [
        {
          title: t('guideDataCollect'),
          link: 'https://clickson.eu/wp-content/uploads/2021/11/Aide-recolte-de-donnees-.pdf',
        },
      ],
    },

    {
      title: t('toolsDataCollect'),
      links: [
        {
          title: t('modelsDataCollect'),
          link: 'https://clickson.eu/wp-content/uploads/2023/01/Exemple_collecte.zip',
        },
      ],
    },
    {
      title: t('game'),
      links: [
        {
          title: t('classEarth'),
          link: 'https://www.materre-enclasse.org',
        },
      ],
    },
  ]

  const getRessources = (environment: Environment) => {
    switch (environment) {
      case Environment.CLICKSON:
        return clicksonRessources
      default:
        return ressources
    }
  }

  return (
    <Block title={t('title')} as="h1">
      {environment === Environment.CUT && (
        <Alert severity="info" className="mb2">
          {customRich(t, 'description')}
        </Alert>
      )}
      <div className={classNames(styles.ressources, 'gapped1')}>
        {getRessources(environment).map(({ title, links }) => (
          <RessourceLinks key={title} title={title} links={links} />
        ))}
      </div>
      {environment === Environment.CUT && (
        <Alert severity="info" className="mt2">
          {t('france2030')}
        </Alert>
      )}
    </Block>
  )
}

export default RessourcesPage
