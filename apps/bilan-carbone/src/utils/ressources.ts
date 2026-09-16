import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { Translations } from '@abc-transitionbascarbone/lib'
import { getEnvVar } from '@abc-transitionbascarbone/lib/environment'
import { hasTranslatedLinks } from '@abc-transitionbascarbone/utils/environmentClient'
import { getTranslations } from 'next-intl/server'

export const getEnvironnementRessources = async (env: Environment, t: Translations) => {
  const linksT = await getTranslations()
  const openCarbonPracticeUrl = linksT('openCarbonPracticeUrl')
  const contactFormUrl = hasTranslatedLinks(env) ? linksT('contactFormUrl') : ''
  const faqUrl = hasTranslatedLinks(env) ? linksT('faqUrl') : ''
  const methodologyUrl = linksT('methodologyUrl')
  const supportEmail = await getEnvVar('SUPPORT_EMAIL', env)

  const commonRessources = [
    {
      title: t('questionMethodo'),
      links: [
        { title: t('openCarbonPractice'), link: openCarbonPracticeUrl },
        ...(contactFormUrl
          ? [
            {
              title: t('contacterViaFormulaire', { supportEmail }),
              link: contactFormUrl,
              isTranslated: true,
            },
          ]
          : []),
      ],
    },
    {
      title: t('questionTechnique'),
      links: [
        ...(faqUrl ? [{ title: t('lireLaFAQ'), link: faqUrl }] : []),
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
    links: [{ title: t('methodeBilanCarbone'), link: methodologyUrl }],
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
    case Environment.CLICKSON: {
      const guideDataCollectUrl = linksT('guideDataCollectUrl')
      const modelsDataCollectUrl = linksT('modelsDataCollectUrl')
      const classEarthUrl = linksT('classEarthUrl')

      return [
        {
          title: t('knowMoreDataCollect'),
          links: [
            {
              title: t('guideDataCollect'),
              link: guideDataCollectUrl,
            },
          ],
        },

        {
          title: t('toolsDataCollect'),
          links: [
            {
              title: t('modelsDataCollect'),
              link: modelsDataCollectUrl,
            },
          ],
        },
        {
          title: t('game'),
          links: [
            {
              title: t('classEarth'),
              link: classEarthUrl,
            },
          ],
        },
      ]
    }
    case Environment.TILT: {
      const sphereAssociativeUrl = linksT('sphereAssociativeUrl')

      return [
        {
          title: t('methodeAssociative'),
          links: [
            {
              title: t('sphereAssociative'),
              link: sphereAssociativeUrl,
            },
          ],
        },
        methodBC,
        ...commonRessources,
      ]
    }
    default:
      return [methodBC, ...commonRessources]
  }
}
