import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { Translations } from '@abc-transitionbascarbone/lib'
import { getEnvVar } from '@abc-transitionbascarbone/lib/environment'
import { hasTranslatedLinks } from '@abc-transitionbascarbone/utils/environmentClient'
import { getTranslations } from 'next-intl/server'

const getTypeformUrl = (typeformId: string) => `https://form.typeform.com/to/${typeformId}`

const isPlaceholder = (value: string) => value.startsWith('<') && value.endsWith('>')

export const getFeedbackFormUrl = async (env: Environment) => {
  if (env === Environment.MIP) {
    return ''
  }

  const feedbackFormUrl = await getEnvVar('FEEDBACK_FORM_URL', env)
  if (feedbackFormUrl && !isPlaceholder(feedbackFormUrl)) {
    return feedbackFormUrl
  }

  const typeformId = await getEnvVar('FEEDBACK_TYPEFORM_ID', env)

  return typeformId && !isPlaceholder(typeformId) ? getTypeformUrl(typeformId) : ''
}

export const getEnvironnementRessources = async (env: Environment, t: Translations) => {
  const linksT = await getTranslations('links')
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
      return [
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
      return [methodBC, ...commonRessources]
  }
}
