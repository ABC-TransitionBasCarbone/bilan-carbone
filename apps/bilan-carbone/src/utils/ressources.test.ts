import { getEnvironnementRessources } from '@/utils/ressources'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { Locale } from '@abc-transitionbascarbone/i18n/config'
import { Translations } from '@abc-transitionbascarbone/lib'
import { getEnvVar } from '@abc-transitionbascarbone/lib/environment'
import { getLocale } from 'next-intl/server'

jest.mock('next-intl/server', () => ({
  getLocale: jest.fn(),
}))

jest.mock('@abc-transitionbascarbone/lib/environment', () => ({
  getEnvVar: jest.fn(),
}))

const t = ((key: string) => key) as Translations

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

  test('uses EN_FAQ_LINK when locale is EN and EN_FAQ_LINK is defined', async () => {
    jest.mocked(getLocale).mockResolvedValue(Locale.EN)
    jest.mocked(getEnvVar).mockImplementation(async (key) => {
      if (key === 'CONTACT_FORM_URL') {
        return 'https://contact.form'
      }
      if (key === 'EN_FAQ_LINK') {
        return 'https://en.faq'
      }
      if (key === 'FAQ_LINK') {
        return 'https://fr.faq'
      }
      if (key === 'SUPPORT_EMAIL') {
        return 'support@example.com'
      }
      return ''
    })

    const resources = await getEnvironnementRessources(Environment.BC, t)
    const faqLink = getFaqLinkFromResources(resources)

    expect(faqLink).toBe('https://en.faq')
  })

  test('falls back to FAQ_LINK when locale is EN and EN_FAQ_LINK is empty', async () => {
    jest.mocked(getLocale).mockResolvedValue(Locale.EN)
    jest.mocked(getEnvVar).mockImplementation(async (key) => {
      if (key === 'CONTACT_FORM_URL') {
        return 'https://contact.form'
      }
      if (key === 'EN_FAQ_LINK') {
        return ''
      }
      if (key === 'FAQ_LINK') {
        return 'https://fr.faq'
      }
      if (key === 'SUPPORT_EMAIL') {
        return 'support@example.com'
      }
      return ''
    })

    const resources = await getEnvironnementRessources(Environment.BC, t)
    const faqLink = getFaqLinkFromResources(resources)

    expect(faqLink).toBe('https://fr.faq')
  })
})
