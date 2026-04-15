import { Locale } from '@/i18n/config'
import { getEnvVar } from '@/lib/environment'
import { Translations } from '@/types/translation'
import { Environment } from '@repo/db-common/enums'
import { getLocale } from 'next-intl/server'

export const getEnvironnementRessources = async (env: Environment, t: Translations) => {
  const contactForm = await getEnvVar('CONTACT_FORM_URL', env)
  const faq = await getEnvVar('FAQ_LINK', env)
  const supportEmail = await getEnvVar('SUPPORT_EMAIL', env)

  const locale = await getLocale()
  const methodUrl =
    locale === Locale.FR
      ? 'https://www.bilancarbone-methode.com/'
      : 'https://www.bilancarbone-methode.com/methode-bilan-carbone-r-en'

  const commonRessources = [
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

  const methodBC = {
    title: t('enSavoirPlusBilan'),
    links: [{ title: t('methodeBilanCarbone'), link: methodUrl }],
  }

  switch (env) {
    case Environment.CUT:
      return [
        {
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
        },
        ...commonRessources,
        methodBC,
      ]
    case Environment.CLICKSON:
      return [
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
    case Environment.TILT:
      return [
        {
          title: t('methodeAssociative'),
          links: [
            {
              title: t('sphereAssociative'),
              link: 'https://www.plancarbonegeneral.com/approches-sectorielles/sphere-associative',
            },
          ],
        },
        methodBC,
        ...commonRessources,
      ]
    default:
      return [methodBC, ...commonRessources]
  }
}
