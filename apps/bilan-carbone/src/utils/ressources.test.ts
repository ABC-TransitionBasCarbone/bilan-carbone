import { getEnvironnementRessources } from '@/utils/ressources'
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

const t = ((key: string) => {
  throw new Error(`Missing translation: ${key}`)
}) as unknown as Translations

const getFaqLinkFromResources = (resources: Awaited<ReturnType<typeof getEnvironnementRessources>>) => {
  const technicalSection = resources.find((resource) => resource.title === 'questionTechnique')
  const faqLink = technicalSection?.links.find(
    (resourceLink) => resourceLink.title === 'lireLaFAQ' && 'link' in resourceLink,
  )

  return faqLink && 'link' in faqLink ? faqLink.link : undefined
}

describe('getEnvironnementRessources', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const englishTranslations = {
    openCarbonPracticeUrl: 'https://en.open.carbon.practice',
    methodologyUrl: 'https://en.methodology',
    contactFormUrl: 'https://en.contact.form',
    faqUrl: 'https://en.faq',
  } as const

  const translationWithEnglishUrls = Object.assign(
    ((key: string) => englishTranslations[key as keyof typeof englishTranslations] ?? key) as Translations,
    { has: (key: string) => key in englishTranslations },
  )

  test('reads localised links from translations when locale is English', async () => {
    jest.mocked(getTranslations).mockResolvedValue(translationWithEnglishUrls)
    jest.mocked(getEnvVar).mockImplementation(async (key) => {
      if (key === 'SUPPORT_EMAIL') {
        return 'support@example.com'
      }
      return ''
    })

    const resources = await getEnvironnementRessources(Environment.BC, translationWithEnglishUrls)
    const faqLink = getFaqLinkFromResources(resources)
    const contactLink = resources
      .find((resource) => resource.title === 'questionMethodo')
      ?.links.find((resourceLink) => resourceLink.title === 'contacterViaFormulaire' && 'link' in resourceLink)

    expect(faqLink).toBe('https://en.faq')
    expect(contactLink && 'link' in contactLink ? contactLink.link : undefined).toBe('https://en.contact.form')
  })

  test('throws when a required link translation is missing', async () => {
    jest.mocked(getTranslations).mockResolvedValue(t)
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
})
