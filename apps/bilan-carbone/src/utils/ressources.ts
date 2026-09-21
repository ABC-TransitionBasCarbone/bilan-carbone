import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { Translations } from '@abc-transitionbascarbone/lib'
import { getEnvVar } from '@abc-transitionbascarbone/lib/environment'
import { hasTranslatedLinks } from '@abc-transitionbascarbone/utils/environmentClient'
import { getTranslations } from 'next-intl/server'

export const getFeedbackFormUrl = async (env: Environment) => {
  if (env === Environment.MIP) {
    return ''
  }

  return getEnvVar('FEEDBACK_FORM_URL', env)
}

export const getEnvironnementRessources = async (env: Environment, t: Translations) => {
  const linksT = await getTranslations('links')
  const feedbackFormUrl = await getFeedbackFormUrl(env)
  const supportEmail = await getEnvVar('SUPPORT_EMAIL', env)

  const commonRessources = [
    {
      title: t('questionMethodo'),
      links: [
        { title: t('openCarbonPractice'), link: linksT('openCarbonPracticeUrl') },
        ...(hasTranslatedLinks(env)
          ? [
            {
              title: t('contacterViaFormulaire', { supportEmail }),
              link: linksT('contactFormUrl'),
              isTranslated: true,
            },
          ]
          : []),
      ],
    },
    {
      title: t('questionTechnique'),
      links: [
        ...(hasTranslatedLinks(env) ? [{ title: t('lireLaFAQ'), link: linksT('faqUrl') }] : []),
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
    links: [{ title: t('methodeBilanCarbone'), link: linksT('methodologyUrl') }],
  }

  const feedbackRessource = feedbackFormUrl
    ? {
      title: t('feedbackTitle'),
      links: [{ title: t('feedbackLink'), link: feedbackFormUrl, testId: 'feedback-form-link' }],
    }
    : undefined
  const feedbackResources = feedbackRessource ? [feedbackRessource] : []

  switch (env) {
    case Environment.CUT:
      return [
        ...feedbackResources,
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
      return [
        ...feedbackResources,
        {
          title: t('knowMoreDataCollect'),
          links: [
            {
              title: t('guideDataCollect'),
              link: linksT('guideDataCollectUrl'),
            },
          ],
        },

        {
          title: t('toolsDataCollect'),
          links: [
            {
              title: t('modelsDataCollect'),
              link: linksT('modelsDataCollectUrl'),
            },
          ],
        },
        {
          title: t('game'),
          links: [
            {
              title: t('classEarth'),
              link: linksT('classEarthUrl'),
            },
          ],
        },
      ]
    }
    case Environment.TILT: {
      return [
        ...feedbackResources,
        {
          title: t('methodeAssociative'),
          links: [
            {
              title: t('sphereAssociative'),
              link: linksT('sphereAssociativeUrl'),
            },
          ],
        },
        methodBC,
        ...commonRessources,
      ]
    }
    default:
      return [...feedbackResources, methodBC, ...commonRessources]
  }
}
