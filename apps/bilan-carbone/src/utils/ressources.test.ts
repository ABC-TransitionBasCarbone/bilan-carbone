import { getEnvironnementRessources, getFeedbackFormUrl } from '@/utils/ressources'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { Translations } from '@abc-transitionbascarbone/lib'
import { getEnvVar } from '@abc-transitionbascarbone/lib/environment'
import { getTranslations } from 'next-intl/server'

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(),
}))

jest.mock('@abc-transitionbascarbone/lib/environment', () => ({
  getEnvVar: jest.fn(),
}))

const missingTranslation = ((key: string) => {
  throw new Error(`Missing translation: ${key}`)
}) as unknown as Translations

const t = ((key: string) => key) as unknown as Translations

const getFaqLinkFromResources = (resources: Awaited<ReturnType<typeof getEnvironnementRessources>>) => {
  const technicalSection = resources.find((resource) => resource.title === 'questionTechnique')
  const faqLink = technicalSection?.links.find(
    (resourceLink) => resourceLink.title === 'lireLaFAQ' && 'link' in resourceLink,
  )

  return faqLink && 'link' in faqLink ? faqLink.link : undefined
}

const getFeedbackLinkFromResources = (resources: Awaited<ReturnType<typeof getEnvironnementRessources>>) => {
  const feedbackSection = resources.find((resource) => resource.title === 'feedbackTitle')
  const feedbackLink = feedbackSection?.links[0]

  return feedbackLink && 'link' in feedbackLink ? feedbackLink.link : undefined
}

describe('getEnvironnementRessources', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const englishLinkTranslations = {
    openCarbonPracticeUrl: 'https://en.open.carbon.practice',
    methodologyUrl: 'https://en.methodology',
    contactFormUrl: 'https://en.contact.form',
    faqUrl: 'https://en.faq',
  } as const

  const linksT = Object.assign(
    ((key: string) => englishLinkTranslations[key as keyof typeof englishLinkTranslations] ?? key) as Translations,
    { has: (key: string) => key in englishLinkTranslations },
  )

  test('reads localised links from translations when locale is English', async () => {
    jest.mocked(getTranslations).mockResolvedValue(linksT)
    jest.mocked(getEnvVar).mockImplementation(async (key) => {
      if (key === 'SUPPORT_EMAIL') {
        return 'support@example.com'
      }
      return ''
    })

    const resources = await getEnvironnementRessources(Environment.BC, t)
    const faqLink = getFaqLinkFromResources(resources)
    const contactLink = resources
      .find((resource) => resource.title === 'questionMethodo')
      ?.links.find((resourceLink) => resourceLink.title === 'contacterViaFormulaire' && 'link' in resourceLink)

    expect(faqLink).toBe('https://en.faq')
    expect(contactLink && 'link' in contactLink ? contactLink.link : undefined).toBe('https://en.contact.form')
  })

  test('throws when a required link translation is missing', async () => {
    jest.mocked(getTranslations).mockResolvedValue(missingTranslation)
    jest.mocked(getEnvVar).mockImplementation(async (key) => {
      if (key === 'SUPPORT_EMAIL') {
        return 'support@example.com'
      }
      return ''
    })

    await expect(getEnvironnementRessources(Environment.BC, t)).rejects.toThrow(
      'Missing translation: openCarbonPracticeUrl',
    )
  })

  test.each([Environment.BC, Environment.CUT, Environment.TILT, Environment.CLICKSON])(
    'uses the feedback URL for %s',
    async (environment) => {
      jest.mocked(getLocale).mockResolvedValue(Locale.FR)
      jest.mocked(getEnvVar).mockImplementation(async (key, env) => {
        if (key === 'FEEDBACK_FORM_URL') {
          return `https://feedback.${env?.toLowerCase()}`
        }
        return key === 'SUPPORT_EMAIL' ? 'support@example.com' : ''
      })

      const resources = await getEnvironnementRessources(environment, t)

      expect(getFeedbackLinkFromResources(resources)).toBe(`https://feedback.${environment.toLowerCase()}`)
      expect(getEnvVar).toHaveBeenCalledWith('FEEDBACK_FORM_URL', environment)
    },
  )

  test('does not expose a feedback URL for MIP', async () => {
    jest.mocked(getLocale).mockResolvedValue(Locale.FR)
    jest.mocked(getEnvVar).mockResolvedValue('https://feedback.example.com')

    const resources = await getEnvironnementRessources(Environment.MIP, t)

    expect(getFeedbackLinkFromResources(resources)).toBeUndefined()
    expect(getEnvVar).not.toHaveBeenCalledWith('FEEDBACK_FORM_URL', Environment.MIP)
  })

  test('returns an empty feedback URL when it is not configured', async () => {
    jest.mocked(getEnvVar).mockResolvedValue('')

    await expect(getFeedbackFormUrl(Environment.BC)).resolves.toBe('')
  })
})
